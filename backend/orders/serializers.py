from rest_framework import serializers
from .models import Order, OrderItem

class OrderItemSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product",
            "quantity",
            "price",
            "sub_total"
        ]
        read_only_fields = ("price", "sub_total")


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    class Meta:
        model = Order
        fields = "__all__"

    def create(self, validated_data):
        items_data = validated_data.pop("items")
        order = Order.objects.create(**validated_data)

        total = 0

        for item in items_data:
            product = item['product']
            quantity = item['quantity']

            order_item = OrderItem.objects.create(
                order=order,
                product=product,
                quantity=quantity,
                price=product.price,
                sub_total=product.price * quantity
            )

            total += order_item.sub_total

        order.total_amount = total
        order.save()

        return order

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            existing_items = {item.id: item for item in instance.items.all()}
            sent_ids = []

            for item_data in items_data:
                item_id = item_data.get('id')
                product = item_data['product']
                quantity = item_data['quantity']

                if item_id and item_id in existing_items:
                    order_item = existing_items[item_id]
                    order_item.product = product
                    order_item.quantity = quantity
                    order_item.save()
                    sent_ids.append(item_id)
                else:
                    order_item = OrderItem.objects.create(
                        order=instance,
                        product=product,
                        quantity=quantity,
                        price=product.price,
                        sub_total=product.price * quantity,
                    )
                    sent_ids.append(order_item.id)

            if not self.partial:
                for item_id, order_item in existing_items.items():
                    if item_id not in sent_ids:
                        order_item.delete()

        instance.total_amount = sum(item.sub_total for item in instance.items.all())
        instance.save()
        return instance
    

