# cashier/admin.py

from django.contrib import admin
from .models import Customer, DiscountSetting, Order, OrderItem, TaxSetting
from django.contrib import admin
from .models import Order, OrderItem, Customer


# 🔹 INLINE ITEMS (shows items inside order)
class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "order_id",
        "customer_name",
        "order_type",
        "amount_display",
        "advance_paid",
        "remaining_amount",
        "payment_mode",
        "status_badge",
        "created_at",
    )

    list_filter = (
        "status",
        "payment_mode",
        "is_bulk",
        "is_advance",
        "created_at",
    )

    search_fields = (
        "order_id",
        "customer__name",
        "customer__phone",
    )

    readonly_fields = (
        "created_at",
        "paid_at",
    )

    inlines = [OrderItemInline]

    ordering = ("-created_at",)

    # ✅ CUSTOMER NAME
    def customer_name(self, obj):
        return obj.customer.name if obj.customer else "Walk-in"

    customer_name.short_description = "Customer"

    # ✅ ORDER TYPE
    def order_type(self, obj):
        return "Pre-Order" if obj.is_advance else "Normal"

    # ✅ AMOUNT DISPLAY (FIXED)
    def amount_display(self, obj):
        # if obj.custom_price:
        #     return f"₹{obj.custom_price} (Custom)"
        return f"₹{obj.final_amount}"

    amount_display.short_description = "Amount"

    # ✅ STATUS COLOR
    def status_badge(self, obj):
        color = {
            "paid": "green",
            "pending": "orange",
            "advance_paid": "blue",
            "cancelled": "red"
        }.get(obj.status, "gray")

        return f'<span style="color:white;padding:4px 8px;border-radius:6px;background:{color}">{obj.status}</span>'

    status_badge.allow_tags = True
    status_badge.short_description = "Status"
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
    list_display = ['discount_type', 'discount_value', 'min_amount', 'is_active']
@admin.register(TaxSetting)
class TaxSettingAdmin(admin.ModelAdmin):
    list_display = ("enabled", "percentage", "updated_at")
    list_display_links = ("updated_at",)   # 👈 clickable column
    list_editable = ("enabled", "percentage")

    def has_add_permission(self, request):
        return not TaxSetting.objects.exists()