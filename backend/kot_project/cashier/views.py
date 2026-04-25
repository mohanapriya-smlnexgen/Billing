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
from .models import Order, OrderItem
from .serializers import OrderSerializer
from management.models import AdminUser


class CashierOrderViewSet(viewsets.ModelViewSet):
    """
    API for Cashier:
    - List all orders (pending + paid)
    - Create new order (waiter → cashier)
    - Mark order as paid
    - Cancel order
    - Get today's collection summary
    - Refund order (partial or full)
    """
    queryset = Order.objects.prefetch_related('items').order_by('-created_at')
    serializer_class = OrderSerializer
    permission_classes = [AllowAny]  # Use IsAuthenticated in production

    # ──────────────────────────────
    # 1. CREATE ORDER (Waiter → Cashier)
    # ──────────────────────────────
    # cashier/views.py - Update the create_order method
    # cashier/views.py
    @action(detail=False, methods=['post'], url_path='create_order')
    def create_order(self, request):
        print("API DB:", settings.DATABASES['default']['NAME'])
        data = request.data

        try:
            required = ['total_amount', 'cart']
            missing = [field for field in required if field not in data]

            if missing:
                return Response(
                    {"detail": f"Missing fields: {', '.join(missing)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            waiter = None
            waiter_id = data.get('waiter')

            if waiter_id:
                try:
                    waiter = AdminUser.objects.get(id=waiter_id)
                except AdminUser.DoesNotExist:
                    return Response(
                        {"detail": "Invalid waiter_id"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            payment_mode = data.get('payment_mode', 'cash').lower()
            selected_seats = data.get('selected_seats', [])
            table_id = data.get('table_id')

            order = Order.objects.create(
                table_number=data.get('table_number') or None,
                table_id=table_id,
                selected_seats=selected_seats,
                total_amount=Decimal(str(data['total_amount'])),
                received_amount=Decimal(str(data.get('received_amount', 0))),
                payment_mode=payment_mode,
                status='pending',
                waiter=waiter
            )

            cart = data.get('cart', [])

            if not isinstance(cart, list):
                return Response(
                    {"detail": "cart must be a list"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            order_items = []

            for item in cart:
                if not all(k in item for k in ['name', 'quantity', 'price']):
                    return Response(
                        {"detail": "Each cart item must contain name, quantity and price"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                order_items.append(
                    OrderItem(
                        order=order,
                        food_id=item.get('food_id') or item.get('id'),
                        name=str(item['name']),
                        quantity=int(item['quantity']),
                        price=float(item['price'])
                    )
                )

            OrderItem.objects.bulk_create(order_items)

            serializer = OrderSerializer(order)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    # ──────────────────────────────
    # 2. MARK AS PAID
    # ──────────────────────────────
    @action(detail=True, methods=['post'], url_path='mark_paid')
    def mark_paid(self, request, pk=None):
        try:
            order = self.get_object()

            # ❌ Prevent double payment
            if order.status == 'paid':
                return Response(
                    {"detail": "Order already paid"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # ✅ Get data safely
            received_amount = Decimal(str(request.data.get('received_amount', 0)))
            payment_mode = request.data.get('payment_mode', 'cash').lower()

            # ❌ Validate amount
            if received_amount <= 0:
                return Response(
                    {"detail": "Received amount must be greater than 0"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if received_amount < order.total_amount:
                return Response(
                    {"detail": "Received amount is less than total amount"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # ✅ Update order
            order.received_amount = received_amount
            order.payment_mode = payment_mode
            order.status = 'paid'
            order.paid_at = timezone.now()
            order.save()

            # ✅ IMPORTANT: Return FULL ORDER (fixes frontend issues)
            serializer = self.get_serializer(order)

            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
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
            total=Sum('total_amount'),
            cash=Sum('total_amount', filter=Q(payment_mode='cash')),
            card=Sum('total_amount', filter=Q(payment_mode='card')),
            upi=Sum('total_amount', filter=Q(payment_mode='upi')),
        )

        result = {
            "total": float(collection['total'] or 0),
            "cash": float(collection['cash'] or 0),
            "card": float(collection['card'] or 0),
            "upi": float(collection['upi'] or 0),
        }

        return Response(result, status=status.HTTP_200_OK)

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