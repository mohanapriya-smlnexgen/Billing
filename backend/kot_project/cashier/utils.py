# cashier/utils.py

from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Sum, Q
from datetime import date
from cashier.models import Order
from management.models import AdminUser


def send_daily_sales_report():
    today = date.today()

    paid_orders = Order.objects.filter(
        status='paid',
        paid_at__date=today
    )

    total_orders = paid_orders.count()

    collection = paid_orders.aggregate(
        total=Sum('total_amount'),
        cash=Sum('total_amount', filter=Q(payment_mode='cash')),
        card=Sum('total_amount', filter=Q(payment_mode='card')),
        upi=Sum('total_amount', filter=Q(payment_mode='upi')),
    )

    total_amount = float(collection['total'] or 0)
    cash_amount = float(collection['cash'] or 0)
    card_amount = float(collection['card'] or 0)
    upi_amount = float(collection['upi'] or 0)

    paid_list = []

    for order in paid_orders:
        paid_list.append(
            f"Order #{order.order_id} | Table: {order.table_number or '-'} | "
            f"Amount: ₹{order.total_amount} | Mode: {order.payment_mode}"
        )

    orders_text = "\n".join(paid_list) if paid_list else "No paid orders today"

    subject = f"Daily Sales Report - {today.strftime('%d-%m-%Y')}"

    message = f"""
Daily Sales Report
Date: {today.strftime('%d-%m-%Y')}

Total Paid Orders: {total_orders}
Total Collection: ₹{total_amount}

Cash Collection: ₹{cash_amount}
Card Collection: ₹{card_amount}
UPI Collection: ₹{upi_amount}

Paid Orders:
{orders_text}
"""

    admin_emails = AdminUser.objects.exclude(email='').values_list('email', flat=True)

    if admin_emails:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=list(admin_emails),
            fail_silently=False,
        )

