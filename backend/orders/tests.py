from django.test import TestCase
from django.contrib.auth import get_user_model
from decimal import Decimal
from products.models import Product
from .models import Order, OrderItem

User = get_user_model()

class OrderAndOrderItemModelTests(TestCase):

    def setUp(self):

        self.user = User.objects.create_user(
            email="khan@gmail.com", 
            password="1234"
        )
        

        self.product = Product.objects.create(
            id="P102",
            name="Gaming Mouse",
            sku="MS-GAME-99",
            price=Decimal("49.99"),
            stock=50,
            status="active"
        )

    def test_create_order_default_values(self):
        order = Order.objects.create(user=self.user)
        
        self.assertEqual(order.user, self.user)
        self.assertEqual(order.total_amount, Decimal("0.00"))
        self.assertEqual(order.status, "pending")

        self.assertIsNotNone(order.created_at)
        self.assertIsNotNone(order.updated_at)

    def test_order_string_representation(self):
        order = Order.objects.create(user=self.user)
        self.assertEqual(str(order), f'Oder #{order.id}')

    def test_order_status_choices(self):
        order = Order.objects.create(user=self.user, status="paid")
        self.assertEqual(order.status, "paid")
        
        order.status = "canceled"
        order.save()
        self.assertEqual(order.status, "canceled")

    def test_order_item_save_populates_price_and_subtotal(self):
        order = Order.objects.create(user=self.user)
        
        order_item = OrderItem.objects.create(
            order=order,
            product=self.product,
            quantity=3
        )
        
        self.assertEqual(order_item.price, self.product.price)
        self.assertEqual(order_item.price, Decimal("49.99"))
        
        expected_subtotal = Decimal("49.99") * 3
        self.assertEqual(order_item.sub_total, expected_subtotal)

    def test_order_item_update_recalculates_subtotal_retaining_original_price(self):
        order = Order.objects.create(user=self.user)
        order_item = OrderItem.objects.create(
            order=order,
            product=self.product,
            quantity=2
        )
        
        self.assertEqual(order_item.sub_total, Decimal("99.98"))

        self.product.price = Decimal("59.99")
        self.product.save()
        

        order_item.quantity = 4
        order_item.save()
        
        self.assertEqual(order_item.price, Decimal("49.99"))

        self.assertEqual(order_item.sub_total, Decimal("199.96"))

    def test_order_item_string_representation(self):
        order = Order.objects.create(user=self.user)
        order_item = OrderItem.objects.create(
            order=order,
            product=self.product,
            quantity=1
        )
        self.assertEqual(str(order_item), self.product.name)

    def test_order_related_items_reverse_relationship(self):
        order = Order.objects.create(user=self.user)
        OrderItem.objects.create(order=order, product=self.product, quantity=1)
        
        self.assertEqual(order.items.count(), 1)
        self.assertEqual(order.items.first().product, self.product)