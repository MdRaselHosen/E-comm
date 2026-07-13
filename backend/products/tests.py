from django.test import TestCase
from django.db.utils import IntegrityError
from django.core.exceptions import ValidationError
from decimal import Decimal
from .models import Product

class ProductModelTests(TestCase):

    def setUp(self):
        self.valid_product_data = {
            "id": "P101",
            "name": "Wireless Mouse",
            "sku": "MS-WRLS-001",
            "description": "High precision wireless ergonomic mouse.",
            "price": Decimal("29.99"),
            "stock": 100,
            "status": Product.Status.ACTIVE
        }

    def test_create_product_successful(self):
        product = Product.objects.create(**self.valid_product_data)
        
        self.assertEqual(product.id, "P101")
        self.assertEqual(product.name, "Wireless Mouse")
        self.assertEqual(product.sku, "MS-WRLS-001")
        self.assertEqual(product.description, "High precision wireless ergonomic mouse.")
        self.assertEqual(product.price, Decimal("29.99"))
        self.assertEqual(product.stock, 100)
        self.assertEqual(product.status, Product.Status.ACTIVE)
        
        self.assertIsNotNone(product.created_at)
        self.assertIsNotNone(product.updated_at)

    def test_product_string_representation(self):

        product = Product.objects.create(**self.valid_product_data)
        self.assertEqual(str(product), product.name)

    def test_default_status_is_active(self):

        data = self.valid_product_data.copy()
        data.pop("status")
        
        product = Product.objects.create(**data)
        self.assertEqual(product.status, Product.Status.ACTIVE)

    def test_default_stock_is_zero(self):
        data = self.valid_product_data.copy()
        data.pop("stock")
        
        product = Product.objects.create(**data)
        self.assertEqual(product.stock, 0)

    def test_duplicate_id_raises_integrity_error(self):

        Product.objects.create(**self.valid_product_data)
        

        duplicate_data = self.valid_product_data.copy()
        duplicate_data["sku"] = "MS-WRLS-002" 
        
        with self.assertRaises(IntegrityError):
            Product.objects.create(**duplicate_data)

    def test_duplicate_sku_raises_integrity_error(self):

        Product.objects.create(**self.valid_product_data)
        
        duplicate_data = self.valid_product_data.copy()
        duplicate_data["id"] = "PROD-102"
        
        with self.assertRaises(IntegrityError):
            Product.objects.create(**duplicate_data)

    def test_blank_description_allowed(self):
        data = self.valid_product_data.copy()
        data["description"] = ""
        
        product = Product.objects.create(**data)
        self.assertEqual(product.description, "")

    def test_inactive_status_choice(self):
        data = self.valid_product_data.copy()
        data["status"] = Product.Status.INACTIVE
        
        product = Product.objects.create(**data)
        self.assertEqual(product.status, Product.Status.INACTIVE)