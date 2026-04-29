# backend/kot_project/cashier/views.py
from decimal import Decimal

from decimal import Decimal

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny 
from django.utils import timezone
from django.db.models import Sum, Q
from datetime import date

from django.conf import settings
from .models import DiscountSetting, Order, OrderItem, Customer
from .serializers import CustomerSerializer, OrderSerializer
from management.models import AdminUser


class CashierOrderViewSet(viewsets.ModelViewSet):
   
    queryset = Order.objects.prefetch_related('items').order_by('-created_at')
    serializer_class = OrderSerializer
    permission_classes = [AllowAny]  # Use IsAuthenticated in production
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
                "credits": float(customer.credits)
            })
        except Customer.DoesNotExist:
            return Response({
                "detail": "Customer not found",
                "exists": False
            }, status=404)
    @action(detail=False, methods=['post'], url_path='preview_discount')
    def preview_discount(self, request):
        total = Decimal(str(request.data.get('total_amount', 0)))

        discount = Decimal('0')
        discount_obj = DiscountSetting.objects.filter(is_active=True).first()

        if discount_obj and total >= discount_obj.min_amount:
            discount = (total * discount_obj.discount_percent) / 100

        return Response({
            "discount": float(discount)
      })
    @action(detail=False, methods=['post'], url_path='create_order')
    def create_order(self, request):
        data = request.data

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
    # Update name if it's empty OR still "Guest"
                    if (not customer.name or customer.name.lower() == "guest") and data.get("name"):
                        customer.name = data.get("name")
                        customer.save()
                else:
                    customer = Customer.objects.create(
                        phone=phone,
                        name=data.get("name", "Guest")
                    )

            # ───── AMOUNTS ─────
            total = Decimal('0')

            for item in cart:
                price = Decimal(str(item.get('price', 0)))
                qty = int(item.get('quantity', 0))
                total += price * qty

            if total <= 0:
                return Response({"detail": "Invalid total amount"}, status=400)

            # ───── DISCOUNT (AUTO) ─────
            # ───── DISCOUNT ─────
            discount = Decimal(str(data.get('discount', 0)))

            # Apply auto discount ONLY if manual discount is 0
            if discount == 0:
                discount_obj = DiscountSetting.objects.filter(is_active=True).first()
                if discount_obj and total >= discount_obj.min_amount:
                    discount = (total * discount_obj.discount_percent) / 100

            # ───── CREDIT ─────
            credit = Decimal(str(data.get('credit', 0)))

            if credit < 0:
                return Response({"detail": "Invalid credit"}, status=400)

            if customer:
                if credit > customer.credits:
                    return Response({"detail": "Not enough credits"}, status=400)
            custom_price = data.get('custom_price')

            if custom_price is not None:
                final_amount = Decimal(str(custom_price))
            else:
                final_amount = total - discount - credit
            # ───── FINAL AMOUNT ─────
            advance = Decimal(str(data.get('advance_paid', 0)))
            custom_price = data.get('custom_price')

            if custom_price is not None:
                final_amount = Decimal(str(custom_price))
            else:
                final_amount = total - discount - credit

            if final_amount < 0:
                final_amount = Decimal('0')
            

            remaining_amount = final_amount - advance

            # Never allow negative remaining
            if remaining_amount < 0:
                remaining_amount = Decimal('0')
            # status logic
            # NEVER auto mark paid on create
            if advance > 0:
                status_value = 'advance_paid'
            else:
                status_value = 'pending'

            if final_amount < 0:
                final_amount = Decimal('0')

            # ───── ALERTS ─────
            if discount > (total * Decimal('0.5')):
                print("⚠ High discount detected")

            if total > 5000:
                print("🔥 High value order")

            if customer and customer.credits < 50:
                print(f"⚠ Low credits for {customer.name}")

            # ───── CREATE ORDER ─────
            order = Order.objects.create(
            customer=customer,
            total_amount=total,
            discount_amount=discount,
            credit_used=credit,
            final_amount=final_amount,

            advance_paid=advance,              # ✅ NEW
            remaining_amount=remaining_amount, # ✅ NEW

            payment_mode = data.get('payment_mode') or 'cash',
            is_bulk=data.get('is_bulk', False),
            bulk_note=data.get('bulk_note', ''),
            is_advance=data.get('is_advance', False),
            scheduled_time=data.get('scheduled_time'),
            source=data.get('source', 'offline'),
            external_order_id=data.get('external_order_id', ''),

            status=status_value               # ✅ IMPORTANT
        )

            # ───── SAVE ITEMS ─────
            items = []
            for item in cart:
                items.append(OrderItem(
                    order=order,
                    food_id=item.get('food_id'),
                    name=item['name'],
                    quantity=item['quantity'],
                    price=item['price']
                ))

            OrderItem.objects.bulk_create(items)

            # ───── DEDUCT CUSTOMER CREDIT ─────
            if customer and credit > 0:
                customer.credits -= credit
                customer.save()

            return Response(OrderSerializer(order).data)

        except Exception as e:
            return Response({"detail": str(e)}, status=400)
    # ──────────────────────────────
    # 2. MARK AS PAID
    # ──────────────────────────────
    @action(detail=True, methods=['post'], url_path='mark_paid')
    def mark_paid(self, request, pk=None):
        order = self.get_object()

        if order.status == 'paid':
            return Response({"detail": "Already paid"}, status=400)

        received = Decimal(str(request.data.get('received_amount', 0)))

        if received <= 0:
            return Response({"detail": "Invalid payment amount"}, status=400)

        # ✅ ALWAYS use remaining_amount (single source of truth)
        due = order.remaining_amount

        if due <= 0:
            return Response({"detail": "Order already settled"}, status=400)

        if received < due:
            return Response({"detail": "Insufficient amount"}, status=400)

        # ✅ Add payment (important)
        order.received_amount += received

        # ✅ Calculate change
        change = received - due

        # ✅ Close order
        order.remaining_amount = Decimal('0')
        order.status = 'paid'
        order.paid_at = timezone.now()

        order.save()

        # ✅ CREDIT RETURN (loyalty)
        if order.customer and change > 0:
            order.customer.credits += change
            order.customer.save()

        return Response({
            **OrderSerializer(order).data,
            "change_returned": float(change)  # 🔥 useful for frontend
        })
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
            remaining = float(order.total_amount) - float(order.refunded_amount or 0)
            amount = float(request.data.get('amount', 0))

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

    # Add this action to handle /api/customers/{id}/orders/
    @action(detail=True, methods=['get'])
    def orders(self, request, pk=None):
        customer = self.get_object()
        # Fetch all orders for this customer, including their items
        orders = Order.objects.filter(customer=customer).prefetch_related('items').order_by('-created_at')
        
        # We reuse the OrderSerializer you already have
        serializer = OrderSerializer(orders, many=True)
        
        return Response({
            "customer": CustomerSerializer(customer).data,
            "orders": serializer.data
        })

    # Optional: If you want the list view to include order counts for your "State" logic
    def get_queryset(self):
        from django.db.models import Count
        return Customer.objects.annotate(order_count=Count('order')).order_by('-id')
