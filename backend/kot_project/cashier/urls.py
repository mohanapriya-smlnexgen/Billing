# backend/cashier/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CashierOrderViewSet, CustomerViewSet

router = DefaultRouter()
router.register(r'cashier-orders', CashierOrderViewSet),
router.register(r'customers', CustomerViewSet)
urlpatterns = [
    path('', include(router.urls)),
    
]