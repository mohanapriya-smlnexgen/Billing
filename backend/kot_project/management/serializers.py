# backend/management/serializers.py
from rest_framework import serializers
from .models import FoodItem, FoodVariant,RestaurantTable,SubCategory,TableSeat
from rest_framework import serializers
from .models import ReportSetting


class ReportSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportSetting
        fields = '__all__'
from rest_framework import serializers
from .models import RestaurantSetting

class RestaurantSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = RestaurantSetting
        fields = '__all__'
class SubCategorySerializer(serializers.ModelSerializer):
    timing_display = serializers.ReadOnlyField()
    has_timing = serializers.ReadOnlyField()
    is_available_now = serializers.ReadOnlyField()
    
    class Meta:
        model = SubCategory
        fields = [
            'subcategory_id', 'subcategory_name', 
            'start_time', 'end_time', 'is_timing_active',
            'timing_display', 'has_timing', 'is_available_now',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['subcategory_id', 'created_at', 'updated_at']

from rest_framework import serializers
from .models import FoodItem, FoodVariant

class FoodVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodVariant
        fields = ['unit', 'value', 'price']   # ❗ REMOVE food_item here


class FoodItemSerializer(serializers.ModelSerializer):
    variants = FoodVariantSerializer(many=True, required=False)

    class Meta:
        model = FoodItem
        fields = '__all__'

    def create(self, validated_data):
        variants_data = validated_data.pop('variants', [])

        # Create Food Item first
        food = FoodItem.objects.create(**validated_data)

        # Now attach variants
        for variant in variants_data:
            FoodVariant.objects.create(food_item=food, **variant)

        return food
    def update(self, instance, validated_data):
        variants_data = validated_data.pop('variants', [])

        # update main fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # clear old variants
        instance.variants.all().delete()

        # add new variants
        for variant in variants_data:
            FoodVariant.objects.create(food_item=instance, **variant)

        return instance
        
class TableSeatSerializer(serializers.ModelSerializer):
    class Meta:
        model = TableSeat
        fields = ['seat_id', 'seat_number', 'row_number', 'seat_label', 'is_available']

class RestaurantTableSerializer(serializers.ModelSerializer):
    seats = TableSeatSerializer(many=True, read_only=True)
    available_seats = serializers.ReadOnlyField()
    seat_arrangement = serializers.ReadOnlyField()
    
    class Meta:
        model = RestaurantTable
        fields = [
            'table_id', 
            'table_number', 
            'total_seats', 
            'seats_per_row', 
            'is_active', 
            'seats',
            'available_seats',
            'seat_arrangement',
            'created_at'
        ]
        read_only_fields = ['table_id', 'created_at']

    def get_available_seats(self, obj):
        return obj.get_available_seats()

    def get_seat_arrangement(self, obj):
        return obj.get_seat_arrangement()