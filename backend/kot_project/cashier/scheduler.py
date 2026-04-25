# cashier/scheduler.py

from apscheduler.schedulers.background import BackgroundScheduler
from django.core.management import call_command
import logging

logger = logging.getLogger(__name__)

def send_daily_sales_report():
    try: 
        print("Scheduler triggered")
        call_command('send_daily_report')
        print("Daily sales report sent successfully")
    except Exception as e:
        print("Error sending daily report:", str(e))

def start():
    scheduler = BackgroundScheduler()
    
    # Runs every day at 10:00 PM
    scheduler.add_job(
        send_daily_sales_report,
        'cron',
        hour=22,
        minute=00
    )

    scheduler.start()
    print("Daily report scheduler started")