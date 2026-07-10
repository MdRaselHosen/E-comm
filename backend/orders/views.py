from django.shortcuts import get_object_or_404
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status

from .models import Order, OrderItem
from .serializers import OrderSerializer, OrderItemSerializer
from products.models import Product


class OrderViewSet(ModelViewSet):
    
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Order.objects.all()
        return Order.objects.filter(user=user)

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        data['user'] = request.user.id

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=['post'])
    def add_item(self, request, pk=None):
        order = get_object_or_404(self.get_queryset(), pk=pk)
        product_id = request.data.get('product')
        quantity = request.data.get('quantity')

        if product_id is None or quantity is None:
            return Response({"detail": "product and quantity are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            product = Product.objects.get(pk=product_id)
        except Product.DoesNotExist:
            return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            quantity = int(quantity)
        except (TypeError, ValueError):
            return Response({"detail": "quantity must be an integer."}, status=status.HTTP_400_BAD_REQUEST)

        order_item = OrderItem.objects.create(
            order=order,
            product=product,
            quantity=quantity,
            price=product.price,
            sub_total=product.price * quantity,
        )

        order.total_amount = sum(item.sub_total for item in order.items.all())
        order.save()

        return Response(OrderItemSerializer(order_item).data, status=status.HTTP_201_CREATED)

# -----------------------------------------------

