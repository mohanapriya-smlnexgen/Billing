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
    customer = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = '__all__'

    def get_customer(self, obj):
        if obj.customer:
            return {
                "id": obj.customer.id,
                "name": obj.customer.name,
                "phone": obj.customer.phone,
            }
        return None

    def to_representation(self, instance):
        try:
            data = super().to_representation(instance)

            # Convert Decimals to float safely
            decimal_fields = ['total_amount', 'discount_amount', 'credit_used', 
                            'final_amount', 'tax_amount', 'received_amount', 
                            'advance_paid', 'remaining_amount']

            for field in decimal_fields:
                if data.get(field) is not None:
                    data[field] = float(data[field])

            # Convert items
            if isinstance(data.get('items'), list):
                for item in data['items']:
                    if item.get('quantity') is not None:
                        item['quantity'] = float(item['quantity'])
                    if item.get('price') is not None:
                        item['price'] = float(item['price'])

            return data

        except Exception as e:
            print("=== SERIALIZER ERROR ===")
            print("Error:", str(e))
            print("Instance ID:", instance.order_id)
            raise  # Re-raise to see full traceback

class CustomerSerializer(serializers.ModelSerializer):
    # This reads the annotation we added in the ViewSet get_queryset
    order_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Customer
        fields = ['id', 'name', 'phone', 'credits', 'order_count']