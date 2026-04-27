# cashier/admin.py

from django.contrib import admin
from .models import Customer, DiscountSetting, Order, OrderItem

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone', 'credits', 'updated_at')
    search_fields = ('name', 'phone')

    actions = ['add_credits']

    def add_credits(self, request, queryset):
        for customer in queryset:
            customer.credits += 100  # or dynamic later
            customer.save()
        self.message_user(request, "Credits added successfully")
@admin.register(DiscountSetting)
class DiscountAdmin(admin.ModelAdmin):
    list_display = ('name', 'discount_percent', 'is_active', 'min_amount')