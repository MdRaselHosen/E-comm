from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.permissions import BasePermission, SAFE_METHODS
from .models import Product
from .serializers import ProductSerializer

# Create your views here.

class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        return request.user.is_authenticated and request.user.is_stuff
            

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAdminOrReadOnly]

    
