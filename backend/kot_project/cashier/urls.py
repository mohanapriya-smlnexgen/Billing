# backend/cashier/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CashierOrderViewSet, CustomerViewSet, get_tax, set_tax

router = DefaultRouter()
router.register(r'cashier-orders', CashierOrderViewSet),
router.register(r'customers', CustomerViewSet)
urlpatterns = [
    path('', include(router.urls)),
    path('settings/get_tax/', get_tax),
path('settings/set_tax/', set_tax),
    
]