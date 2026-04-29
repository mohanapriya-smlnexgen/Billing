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
# serializers.py

class CustomerSerializer(serializers.ModelSerializer):
    # This reads the annotation we added in the ViewSet get_queryset
    order_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Customer
        fields = ['id', 'name', 'phone', 'credits', 'order_count']