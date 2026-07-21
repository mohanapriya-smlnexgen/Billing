# backend/kot_project/cashier/views.py
from decimal import Decimal

from decimal import Decimal
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny 
from django.utils import timezone
from django.db.models import Sum, Q
from django.core.cache import cache
from datetime import date

from django.conf import settings
from urllib3 import request
from .models import DiscountSetting, Order, OrderItem, Customer
from .serializers import CustomerSerializer, OrderHistorySerializer, OrderSerializer
from management.models import AdminUser
from management.models import RestaurantSetting


class CashierOrderViewSet(viewsets.ModelViewSet):
    
    queryset = Order.objects.prefetch_related('items').order_by('-created_at')
    serializer_class = OrderSerializer
    permission_classes = [AllowAny]  # Use IsAuthenticated in production
    @action(detail=False, methods=['get'], url_path='history')
    def history(self, request):

        orders = (
            Order.objects
            .select_related('customer')
            .defer(
                'bulk_note',
                'external_order_id',
                'source',
                'paid_at',
                'refunded_amount',
                'tax_amount',
                'discount_amount',
                'credit_used',
                'received_amount',
                'scheduled_time',
            )
            .order_by('-created_at')
        )

        serializer = OrderHistorySerializer(orders, many=True)

        return Response(serializer.data)
    @action(detail=False, methods=['get'], url_path='preorder-history')
    def preorder_history(self, request):

        orders = (
            Order.objects
            .filter(
                Q(is_advance=True) | Q(is_bulk=True)
            )
            .select_related('customer')
            .defer(
                'bulk_note',
                'external_order_id',
                'source',
                'paid_at',
                'refunded_amount',
                'tax_amount',
                'discount_amount',
                'credit_used',
                'received_amount',
            )
            .order_by('-created_at')
        )

        serializer = OrderHistorySerializer(orders, many=True)

        return Response(serializer.data)
    @action(detail=False, methods=['get'], url_path='search_customer')
    
    def search_customer(self, request):
        phone = request.query_params.get('phone')

        if not phone:
            return Response({"detail": "Phone required"}, status=400)

        try:
            customer = Customer.objects.get(phone=phone)
            return Response({
                "id": customer.id,
                "name": customer.name,
                "phone": customer.phone,
                "credits": float(customer.credits),
                "credit_limit": float(customer.credit_limit),
                "available_credit": float(customer.credit_limit - customer.credits)
            })
        except Customer.DoesNotExist:
            return Response({
                "detail": "Customer not found",
                "exists": False
            }, status=404)
    @action(detail=False, methods=['get'], url_path='dashboard_stats')
    def dashboard_stats(self, request):
        today = date.today()

        today_orders = Order.objects.filter(created_at__date=today)
        paid_orders = today_orders.filter(status='paid')

        stats = {
            "total_orders": today_orders.count(),
            "paid_orders": paid_orders.count(),
            "pending_orders": today_orders.filter(status='pending').count(),

            "today_revenue": float(
                paid_orders.aggregate(total=Sum('final_amount'))['total'] or 0
            ),

            "bulk_orders": today_orders.filter(is_bulk=True).count(),

            "preorders_delivered": today_orders.filter(
                is_advance=True,
                status='paid'
            ).count(),
        }

        return Response(stats)
    @action(detail=False, methods=['post'], url_path='set_discount')
    def set_discount(self, request):
        try:
            discount_type = request.data.get('type')
            value = Decimal(str(request.data.get('value', 0)))

            if discount_type not in ['percentage', 'fixed']:
                return Response({"error": "Invalid discount type"}, status=400)

            if value < 0:
                return Response({"error": "Invalid value"}, status=400)

            if discount_type == 'percentage' and value > 100:
                return Response({"error": "Percentage cannot exceed 100"}, status=400)

            # deactivate old
            DiscountSetting.objects.filter(is_active=True).update(is_active=False)

            # create new
            discount = DiscountSetting.objects.create(
                discount_type=discount_type,
                discount_value=value,
                min_amount=0,
                is_active=True
            )

            return Response({
                "message": "Discount updated",
                "type": discount.discount_type,
                "value": float(discount.discount_value)
            })

        except Exception as e:
            return Response({"error": str(e)}, status=400)
    @action(detail=False, methods=['post'], url_path='preview_discount')
    def preview_discount(self, request):
        total = Decimal(str(request.data.get('total_amount', 0)))

        discount = Decimal('0')
        discount_obj = cache.get("discount_setting")

        if not discount_obj:
            discount_obj = DiscountSetting.objects.filter(is_active=True).first()
            cache.set("discount_setting", discount_obj, 300)

        if discount_obj and total >= discount_obj.min_amount:
            if discount_obj.discount_type == "percentage":
                discount = (total * discount_obj.discount_value) / 100
            else:
                discount = discount_obj.discount_value

        return Response({
            "discount": float(discount)
        } )
    @action(detail=False, methods=['post'], url_path='create_order')
    def create_order(self, request):
    
        setting = cache.get("restaurant_setting")

        if not setting:
            setting = RestaurantSetting.objects.first()
            cache.set("restaurant_setting", setting, 300)
        tax_percentage = setting.tax_percentage if setting else Decimal('5')
        data = request.data
        credit_due_date = data.get('credit_due_date')
        is_credit_order = data.get('is_credit_order', False)
        try:
            cart = data.get('cart', [])
            if not cart:
                return Response({"detail": "Cart is empty"}, status=400)

            # ───── CUSTOMER ─────
            customer = None
            phone = data.get('phone')
            if phone:
                customer = Customer.objects.filter(phone=phone).first()
                if customer:
                    if (not customer.name or customer.name.lower() == "guest") and data.get("name"):
                        customer.name = data.get("name")
                        customer.save()
                else:
                    customer = Customer.objects.create(
                        phone=phone,
                        name=data.get("name", "Guest")
                    )

            # ───── CALCULATE SUBTOTAL ─────
            total = Decimal('0')
            for item in cart:
                price = Decimal(str(item.get('price', 0)))
                qty = Decimal(str(item.get('quantity', 0)))
                total += price * qty

            if total <= 0:
                return Response({"detail": "Invalid total amount"}, status=400)

            # ───── DISCOUNT ─────
            manual_discount = Decimal(str(data.get('discount', 0)))
            discount_type = data.get('discount_type', 'fixed')

            if manual_discount > 0:
                if discount_type == "percentage":
                    discount = (total * manual_discount) / Decimal('100')
                else:
                    discount = manual_discount
            else:
                discount = Decimal('0')

                discount_obj = DiscountSetting.objects.filter(is_active=True).first()
                if discount_obj and total >= discount_obj.min_amount:
                    if discount_obj.discount_type == "percentage":
                        discount = (total * discount_obj.discount_value) / 100
                    else:
                        discount = discount_obj.discount_value

            # ───── CREDIT ─────
            # ───── CREDIT ─────
            # ───── CREDIT ─────
            credit = Decimal(str(data.get('credit', 0)))

            if credit < 0:
                return Response(
                    {"detail": "Invalid credit"},
                    status=400
                )

            # Existing usable credit check
            if customer and credit > customer.credits:
                return Response(
                    {"detail": "Not enough credits"},
                    status=400
                )

            # ───── TAX ─────
            tax_obj = cache.get("tax_setting")

            if not tax_obj:
                tax_obj = TaxSetting.objects.first()
                cache.set("tax_setting", tax_obj, 300)

            tax_percentage = (
                Decimal(str(tax_obj.percentage))
                if tax_obj and tax_obj.enabled
                else Decimal('0')
            )

            subtotal_after_discount = total - discount

            tax_amount = (
                subtotal_after_discount * tax_percentage
            ) / Decimal('100')

            # ───── CREDIT LIMIT VALIDATION ─────
            # advance = Decimal(str(data.get('advance_paid', 0)))

            if customer and is_credit_order:

                pending_due = final_amount

                total_credit_after_order = (
                    customer.credits + pending_due
                )

                if total_credit_after_order > customer.credit_limit:

                    available_limit = (
                        customer.credit_limit - customer.credits
                    )

                    return Response({
                        "detail":
                        f"Credit limit exceeded. Available limit: ₹{available_limit}"
                    }, status=400)
                        # ───── FINAL AMOUNT ─────
            advance = Decimal(str(data.get('advance_paid', 0)))
            custom_price = data.get('custom_price')

            if custom_price is not None:
                final_amount = Decimal(str(custom_price))
            else:
                final_amount = subtotal_after_discount + tax_amount - credit

            if final_amount < 0:
                final_amount = Decimal('0')

            remaining_amount = final_amount - advance
            if remaining_amount < 0:
                remaining_amount = Decimal('0')

            if is_credit_order:
                status_value = 'pending'
            elif advance > 0:
                status_value = 'advance_paid'
            else:
                status_value = 'pending'
            payment_mode = data.get('payment_mode')

            if payment_mode not in ['cash', 'card', 'upi']:
                payment_mode = 'cash'
                
            # 🔥 FIX: Convert null to empty string for bulk_note
            bulk_note = data.get('bulk_note')
            if bulk_note is None:
                bulk_note = ""
                
            # 🔥 FIX: Convert null to empty string for external_order_id
            external_order_id = data.get('external_order_id')
            if external_order_id is None:
                external_order_id = ""
                
            # 🔥 FIX: Convert null to empty string for source
            source = data.get('source')
            if source is None:
                source = 'offline'

            # ───── CREATE ORDER ─────
            order = Order.objects.create(
                customer=customer,
                total_amount=total,
                discount_amount=discount,
                credit_used=credit,
                final_amount=final_amount,
                tax_amount=tax_amount,
                advance_paid=advance,
                remaining_amount=remaining_amount,
                payment_mode=payment_mode,
                is_bulk=data.get('is_bulk', False),
                bulk_note=bulk_note,  # 🔥 Now guaranteed to be string, not None
                is_advance=data.get('is_advance', False),
                scheduled_time=data.get('scheduled_time'),
                source=source,  # 🔥 Now guaranteed to be string
                external_order_id=external_order_id,  # 🔥 Now guaranteed to be string
                status=status_value,
                credit_due_date=credit_due_date,
                is_credit_order=is_credit_order,
            )

            # ───── SAVE ITEMS ─────
            items = []
            for item in cart:
                # 🔥 Handle variant_info
                variant_info = item.get('variant_info')
                if variant_info is None:
                    variant_info = ""
                    
                items.append(OrderItem(
                    order=order,
                    food_id=item.get('food_id'),
                    name=item['name'],
                    quantity=Decimal(str(item['quantity'])),
                    price=Decimal(str(item['price'])),
                    variant_info=variant_info  # 🔥 Now guaranteed to be string
                ))
            OrderItem.objects.bulk_create(items)

            # ───── DEDUCT CREDIT ─────
            # ───── UPDATE CUSTOMER CREDIT ─────
            if customer:

                # Deduct used wallet credit
                if credit > 0:
                    customer.credits -= credit

                # Add remaining due to customer credit
                if remaining_amount > 0:
                    customer.credits += remaining_amount

                customer.save()

            return Response(OrderSerializer(order).data)

        except Exception as e:
            return Response({"detail": str(e)}, status=400)
    # ──────────────────────────────
    # 2. MARK AS PAID
    # ──────────────────────────────
    @action(detail=True, methods=['patch'], url_path='mark_delivered')
    def mark_delivered(self, request, pk=None):
        order = self.get_object()
        order.is_delivered = True
        order.save()

        return Response({
            "success": True,
            "message": "Order delivered successfully"
        })
    @action(detail=True, methods=['post'], url_path='mark_paid')
    def mark_paid(self, request, pk=None):

        order = self.get_object()

        payment_mode = request.data.get('payment_mode')

        received = Decimal(
            str(request.data.get('received_amount', 0))
        )

        due = Decimal(str(order.remaining_amount or 0))

        # ✅ Already fully paid
        if order.status == 'paid' and due <= 0:
            return Response(
                {"detail": "Already paid"},
                status=400
            )

        # ✅ CREDIT ORDER
        if payment_mode == "credit":

            order.payment_mode = "credit"
            order.status = "pending"

            order.received_amount = Decimal('0')

            order.credit_due_date = request.data.get(
                "credit_due_date"
            )

            order.credit_note = request.data.get(
                "credit_note",
                ""
            )

            order.save()

            return Response({
                **OrderSerializer(order).data,
                "message": "Credit order created"
            })

        # ✅ NORMAL PAYMENT VALIDATION
        if received <= 0:
            return Response(
                {"detail": "Invalid payment amount"},
                status=400
            )

        # ✅ Prevent over payment
        if received > due:
            change = received - due
            actual_received = due
        else:
            change = Decimal('0')
            actual_received = received

        # ✅ Update payment
        order.payment_mode = payment_mode

        order.received_amount += actual_received

        order.remaining_amount -= actual_received

        # ✅ Prevent negative
        if order.remaining_amount < 0:
            order.remaining_amount = Decimal('0')

        # ✅ Reduce customer used credit
        if order.customer:

            order.customer.credits -= actual_received

            if order.customer.credits < 0:
                order.customer.credits = Decimal('0')

            order.customer.save()

        # ✅ Status update
        if order.remaining_amount <= 0:
            order.status = "paid"
            order.paid_at = timezone.now()
        else:
            order.status = "pending"

        order.save()

        return Response({
            **OrderSerializer(order).data,
            "change_returned": float(change),
            "paid_amount": float(actual_received),
            "customer_given": float(received),
            "remaining_amount": float(order.remaining_amount)
        })
    @action(detail=True, methods=['post'], url_path='pay_credit')
    def pay_credit(self, request, pk=None):
        order = self.get_object()

        try:
            amount = Decimal(str(request.data.get('amount', 0)))
            payment_mode = request.data.get('payment_mode', 'cash')

            if amount <= 0:
                return Response(
                    {"detail": "Invalid amount"},
                    status=400
                )

            # Only credit orders
            if order.payment_mode != "credit":
                return Response(
                    {"detail": "This is not a credit order"},
                    status=400
                )

            due = Decimal(str(order.remaining_amount or 0))

            if due <= 0:
                return Response(
                    {"detail": "Order already paid"},
                    status=400
                )

            # Prevent extra payment
            if amount > due:
                return Response(
                    {
                        "detail":
                        f"Amount exceeds due. Remaining: ₹{due}"
                    },
                    status=400
                )

            # Update payment
            order.received_amount += amount
            order.remaining_amount -= amount

            # Fully paid
            if order.remaining_amount <= 0:
                order.remaining_amount = Decimal('0')
                order.status = "paid"
                order.paid_at = timezone.now()
            else:
                order.status = "pending"

            # Save last payment mode
            order.last_payment_mode = payment_mode

            order.save()

            return Response({
                "message": "Credit payment updated",
                "received_amount": float(order.received_amount),
                "remaining_amount": float(order.remaining_amount),
                "status": order.status
            })

        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=400
            )
    @action(detail=True, methods=['post'], url_path='update_price')
    def update_price(self, request, pk=None):
        from decimal import Decimal

        order = self.get_object()

        try:
            new_price = Decimal(str(request.data.get('final_amount', 0)))

            if new_price <= 0:
                return Response({"error": "Invalid price"}, status=400)

            # ✅ Update correct field
            order.final_amount = new_price

            # ✅ IMPORTANT: keep data consistent
            order.remaining_amount = new_price - (order.advance_paid or 0)

            if order.remaining_amount < 0:
                order.remaining_amount = Decimal('0')

            order.save()

            return Response({
                "message": "Price updated successfully",
                "order": OrderSerializer(order).data
            })

        except Exception as e:
            return Response({"error": str(e)}, status=400)
# ──────────────────────────────
    # 3. CANCEL ORDER
    # ──────────────────────────────
    @action(detail=True, methods=['post'], url_path='cancel_order')
    def cancel_order(self, request, pk=None):
        try:
            order = self.get_object()
            if order.status == 'cancelled':
                return Response(
                    {"detail": "Order already cancelled"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            order.status = 'cancelled'
            order.cancelled_at = timezone.now()
            order.save()

            return Response(
                {"message": "Order cancelled successfully", "order_id": order.order_id},
                status=status.HTTP_200_OK
            )
        except Order.DoesNotExist:
            return Response(
                {"detail": "Order not found"},
                status=status.HTTP_404_NOT_FOUND
            )

    # ──────────────────────────────
    # 4. TODAY'S COLLECTION SUMMARY
    # ──────────────────────────────
    @action(detail=False, methods=['get'], url_path='today_collection')
    def today_collection(self, request):
        today = date.today()
        paid_orders = Order.objects.filter(
            status='paid',
            paid_at__date=today
        )

        collection = paid_orders.aggregate(
        total=Sum('final_amount'),
        cash=Sum('final_amount', filter=Q(payment_mode='cash')),
        card=Sum('final_amount', filter=Q(payment_mode='card')),
        upi=Sum('final_amount', filter=Q(payment_mode='upi')),
    )

        result = {
            "total": float(collection['total'] or 0),
            "cash": float(collection['cash'] or 0),
            "card": float(collection['card'] or 0),
            "upi": float(collection['upi'] or 0),
        }

        return Response(result, status=status.HTTP_200_OK)
    @action(detail=False, methods=['get'], url_path='advance_orders')
    def advance_orders(self, request):
        status_filter = request.query_params.get('type')  # all / upcoming / due

        now = timezone.now()

        qs = Order.objects.filter(is_advance=True)

        if status_filter == 'upcoming':
            qs = qs.filter(scheduled_time__gte=now)
        elif status_filter == 'due':
            qs = qs.filter(scheduled_time__lte=now)

        return Response(OrderSerializer(qs.order_by('-created_at'), many=True).data)
    @action(detail=False, methods=['get'], url_path='upcoming_orders')
    def upcoming_orders(self, request):
        now = timezone.now()

        orders = Order.objects.filter(
            is_advance=True,
            scheduled_time__lte=now,
            status='advance_paid'
        )

        return Response(OrderSerializer(orders, many=True).data)
    # ──────────────────────────────
    # 5. REFUND ORDER (Partial or Full)
    # ──────────────────────────────
    @action(detail=True, methods=['post'], url_path='refund')
    def refund(self, request, pk=None):
        try:
            order = self.get_object()

            # Calculate remaining refundable amount
            remaining = Decimal(str(order.total_amount)) - Decimal(str(order.refunded_amount or 0))
            amount = Decimal(str(request.data.get('amount', 0)))

            if order.is_refunded and remaining <= 0:
                return Response(
                    {"error": "This order is already fully refunded"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if amount <= 0:
                return Response(
                    {"error": "Refund amount must be greater than 0"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if amount > remaining:
                return Response(
                    {"error": f"Cannot refund ₹{amount}. Max refundable: ₹{remaining}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Process refund
            order.refunded_amount = float(order.refunded_amount or 0) + amount
            order.refund_reason = request.data.get('reason', 'No reason provided')
            order.refunded_at = timezone.now()
            order.save()

            return Response({
                "message": "Refund processed successfully",
                "refunded_amount": float(order.refunded_amount),
                "remaining_amount": float(order.total_amount) - float(order.refunded_amount),
                "is_fully_refunded": order.refunded_amount >= order.total_amount
            }, status=status.HTTP_200_OK)

        except Order.DoesNotExist:
            return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)
        except (ValueError, TypeError) as e:
            return Response({"error": f"Invalid amount: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    @action(detail=False, methods=['get'], url_path='bulk_orders')
    def bulk_orders(self, request):
        orders = Order.objects.filter(is_bulk=True).order_by('-created_at')
        return Response(OrderSerializer(orders, many=True).data)
# views.py
# views.py

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all().order_by('-id')
    serializer_class = CustomerSerializer

    @action(detail=True, methods=['patch'], url_path='set_credit_limit')
    def set_credit_limit(self, request, pk=None):
        customer = self.get_object()

        try:
            limit = Decimal(str(request.data.get('credit_limit', 0)))

            if limit < 0:
                return Response(
                    {"detail": "Invalid credit limit"},
                    status=400
                )

            customer.credit_limit = limit
            customer.save()

            return Response({
                "message": "Credit limit updated",
                "credit_limit": float(customer.credit_limit)
            })

        except Exception as e:
            return Response({"detail": str(e)}, status=400)
    @action(detail=True, methods=['get'])
    def orders(self, request, pk=None):
        customer = self.get_object()
        orders = Order.objects.filter(customer=customer).prefetch_related('items').order_by('-created_at')
        
        serializer = OrderSerializer(orders, many=True)
        
        return Response({
            "customer": CustomerSerializer(customer).data,
            "orders": serializer.data
        })

    # Optional: If you want the list view to include order counts for your "State" logic
    def get_queryset(self):
        from django.db.models import Count
        return Customer.objects.annotate(order_count=Count('order')).order_by('-id')
from .models import TaxSetting
from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['GET'])
def get_tax(request):
    tax, _ = TaxSetting.objects.get_or_create(id=1)

    return Response({
        "enabled": tax.enabled,
        "percentage": tax.percentage
    })


@api_view(['POST'])
def set_tax(request):
    tax, _ = TaxSetting.objects.get_or_create(id=1)

    tax.enabled = request.data.get("enabled", True)
    tax.percentage = Decimal(str(request.data.get("percentage", 5)))
    tax.save()

    return Response({"message": "Tax updated"})
