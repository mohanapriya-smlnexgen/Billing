from rest_framework import serializers
from .models import Order, OrderItem, Customer

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = '__all__'


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    customer = CustomerSerializer(read_only=True)

    class Meta:
        model = Order
        fields = '__all__'