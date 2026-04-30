# cashier/models.py
from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from management.models import AdminUser

class Customer(models.Model):
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15, unique=True)
    email = models.EmailField(blank=True, null=True)
    credits = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    updated_at = models.DateTimeField(auto_now=True)  # NEW
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)  # NEW

    def __str__(self):
        return f"{self.name} ({self.phone})"
class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('advance_paid', 'Advance Paid'), 
        ('paid', 'Paid'),
        ('cancelled', 'Cancelled'),
    ]

    SOURCE_CHOICES = [
        ('offline', 'Offline'),
        ('zomato', 'Zomato'),
        ('swiggy', 'Swiggy'),
    ]

    order_id = models.AutoField(primary_key=True)

    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True)

    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    credit_used = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    final_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    payment_mode = models.CharField(max_length=20, default='cash')
    received_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    # Bulk & advance
    is_bulk = models.BooleanField(default=False)
    bulk_note = models.TextField(blank=True)

    is_advance = models.BooleanField(default=False)
    scheduled_time = models.DateTimeField(null=True, blank=True)
    advance_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    remaining_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    # External tracking
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='offline')
    external_order_id = models.CharField(max_length=100, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    refunded_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        return f"Order #{self.order_id}"
    def balance_amount(self):
        return self.received_amount - self.final_amount

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    food_id = models.IntegerField(null=True)
    name = models.CharField(max_length=200)
    quantity = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    def subtotal(self):
        return self.quantity * self.price
# models.py

class DiscountSetting(models.Model):
    DISCOUNT_TYPE_CHOICES = (
        ('percentage', 'Percentage'),
        ('fixed', 'Fixed Amount'),
    )

    discount_type = models.CharField(
        max_length=20,
        choices=DISCOUNT_TYPE_CHOICES,
        default='percentage'
    )

    discount_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    min_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)