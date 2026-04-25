# cashier/management/commands/send_daily_report.py

from django.core.management.base import BaseCommand
from django.core.mail import EmailMessage
from django.conf import settings
from django.utils import timezone
from cashier.models import Order
from management.models import ReportSetting
from openpyxl import Workbook
from openpyxl.styles import Font
from datetime import timedelta
import os
from datetime import datetime, time
from django.utils import timezone

class Command(BaseCommand):
    help = "Send daily sales report email with Excel attachment"

    def handle(self, *args, **kwargs):
        today = timezone.localdate()

        report_setting = ReportSetting.objects.first()

        if not report_setting or not report_setting.email:
            self.stdout.write(self.style.ERROR("No report email configured"))
            return

                
        start = datetime.combine(today, time.min)
        end = datetime.combine(today, time.max)

        start = timezone.make_aware(start)
        end = timezone.make_aware(end)

        orders = Order.objects.filter(
            status="paid",
            paid_at__range=(start, end)
        ).prefetch_related("items")

        if not orders.exists():
            self.stdout.write(self.style.WARNING("No paid orders found for today"))
            return

        wb = Workbook()
        ws = wb.active
        ws.title = "Daily Sales Report"

        # Header
        headers = [
            "Order ID",
            "Bill Date",
            "Bill Time",
            "Item Name",
            "Qty",
            "Item Price",
            "Item Total",
            "GST/Tax",
            "Grand Total",
            "Cash Received",
            "Balance Return",
            "Payment Mode",
            "Status"
        ]

        for col_num, header in enumerate(headers, 1):
            cell = ws.cell(row=1, column=col_num)
            cell.value = header
            cell.font = Font(bold=True)

        row = 2

        total_orders = orders.count()
        total_sales = 0
        total_tax = 0
        total_received = 0
        total_balance = 0
        cash_count = 0
        card_count = 0
        upi_count = 0

        for order in orders:
            subtotal = 0

            for item in order.items.all():
                item_total = float(item.price) * int(item.quantity)
                subtotal += item_total

            tax = float(order.total_amount) - subtotal
            balance = float(order.received_amount or 0) - float(order.total_amount)

            total_sales += float(order.total_amount)
            total_tax += tax
            total_received += float(order.received_amount or 0)
            total_balance += balance

            if order.payment_mode == "cash":
                cash_count += 1
            elif order.payment_mode == "card":
                card_count += 1
            elif order.payment_mode == "upi":
                upi_count += 1

            for item in order.items.all():
                item_total = float(item.price) * int(item.quantity)

                ws.cell(row=row, column=1, value=order.order_id)
                ws.cell(row=row, column=2, value=order.paid_at.strftime("%d-%m-%Y"))
                ws.cell(row=row, column=3, value=order.paid_at.strftime("%I:%M %p"))
                ws.cell(row=row, column=4, value=item.name)
                ws.cell(row=row, column=5, value=item.quantity)
                ws.cell(row=row, column=6, value=float(item.price))
                ws.cell(row=row, column=7, value=item_total)
                ws.cell(row=row, column=8, value=round(tax, 2))
                ws.cell(row=row, column=9, value=float(order.total_amount))
                ws.cell(row=row, column=10, value=float(order.received_amount or 0))
                ws.cell(row=row, column=11, value=round(balance, 2))
                ws.cell(row=row, column=12, value=order.payment_mode)
                ws.cell(row=row, column=13, value=order.status)

                row += 1

        # Empty row before summary
        row += 2

        summary_data = [
            ["Total Orders", total_orders],
            ["Total Sales Amount", round(total_sales, 2)],
            ["Total GST/Tax", round(total_tax, 2)],
            ["Total Cash Received", round(total_received, 2)],
            ["Total Balance Returned", round(total_balance, 2)],
            ["Cash Payments Count", cash_count],
            ["Card Payments Count", card_count],
            ["UPI Payments Count", upi_count],
        ]

        for summary in summary_data:
            ws.cell(row=row, column=1, value=summary[0])
            ws.cell(row=row, column=2, value=summary[1])
            ws.cell(row=row, column=1).font = Font(bold=True)
            row += 1

        # Auto column width
        for column_cells in ws.columns:
            max_length = 0
            column = column_cells[0].column_letter

            for cell in column_cells:
                try:
                    if cell.value:
                        max_length = max(max_length, len(str(cell.value)))
                except:
                    pass

            adjusted_width = max_length + 5
            ws.column_dimensions[column].width = adjusted_width

        file_name = f"daily_sales_report_{today}.xlsx"
        file_path = os.path.join(settings.BASE_DIR, file_name)

        wb.save(file_path)

        email = EmailMessage(
            subject=f"Daily Sales Report - {today}",
            body=(
                f"Hello Admin,\n\n"
                f"Please find attached the daily sales report for {today}.\n\n"
                f"Total Orders: {total_orders}\n"
                f"Total Sales: ₹{round(total_sales, 2)}\n"
                f"Total Tax: ₹{round(total_tax, 2)}\n"
                f"Total Cash Received: ₹{round(total_received, 2)}\n\n"
                f"Regards,\nRestaurant Billing System"
            ),
            from_email=settings.EMAIL_HOST_USER,
            to=[report_setting.email],
        )

        email.attach_file(file_path)
        email.send()

        if os.path.exists(file_path):
            os.remove(file_path)

        self.stdout.write(
            self.style.SUCCESS(
                f"Daily sales report email sent successfully to {report_setting.email}"
            )
        )