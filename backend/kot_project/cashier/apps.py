from django.apps import AppConfig


class CashierConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'cashier'
    def ready(self):
        import os

        # Avoid duplicate scheduler in development
        if os.environ.get('RUN_MAIN') == 'true':
            from .scheduler import start
            start()