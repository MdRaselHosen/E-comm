from django.test import TestCase
from django.contrib.auth import get_user_model
from django.db.utils import IntegrityError
from orders.models import Order
from .models import Payment

User = get_user_model()

class PaymentModelTests(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            email="khan@gmail.com", 
            password="1234"
        )
        
        self.order = Order.objects.create(
            user=self.user,
            total_amount=150.00
        )
        
        # Define valid payload structures for tests
        self.valid_payment_data = {
            "order": self.order,
            "provider": "stripe",
            "transaction_id": "ch_3MvW2B2eZvKYlo2C1x9A8B7C",
            "status": "pending",
            "raw_responses": {"id": "ch_123", "object": "charge", "amount": 15000}
        }

    def test_create_payment_successful(self):
        payment = Payment.objects.create(**self.valid_payment_data)
        
        self.assertEqual(payment.order, self.order)
        self.assertEqual(payment.provider, "stripe")
        self.assertEqual(payment.transaction_id, "ch_3MvW2B2eZvKYlo2C1x9A8B7C")
        self.assertEqual(payment.status, "pending")
        self.assertEqual(payment.raw_responses, self.valid_payment_data["raw_responses"])
        
        self.assertIsNotNone(payment.created_at)
        self.assertIsNotNone(payment.updated_at)

    def test_payment_default_status_is_pending(self):
        data = self.valid_payment_data.copy()
        data.pop("status")
        
        payment = Payment.objects.create(**data)
        self.assertEqual(payment.status, "pending")

    def test_payment_string_representation(self):
        payment = Payment.objects.create(**self.valid_payment_data)
        expected_str = f"{payment.provider} - {payment.transaction_id}"
        self.assertEqual(str(payment), expected_str)

    def test_duplicate_transaction_id_raises_integrity_error(self):
        Payment.objects.create(**self.valid_payment_data)
        
        another_order = Order.objects.create(user=self.user, total_amount=50.00)

        duplicate_payment_data = self.valid_payment_data.copy()
        duplicate_payment_data["order"] = another_order
        
        with self.assertRaises(IntegrityError):
            Payment.objects.create(**duplicate_payment_data)

    def test_status_choices_success_and_failed(self):
        payment = Payment.objects.create(**self.valid_payment_data)

        payment.status = "success"
        payment.save()
        self.assertEqual(payment.status, "success")
        
        payment.status = "failed"
        payment.save()
        self.assertEqual(payment.status, "failed")

    def test_raw_responses_can_be_blank_or_null(self):
        data = self.valid_payment_data.copy()
        data["transaction_id"] = "tx_null_json_test"
        data["raw_responses"] = None
        
        payment = Payment.objects.create(**data)
        self.assertNil = self.assertIsNone(payment.raw_responses)

    def test_order_related_payments_reverse_lookup(self):
        payment = Payment.objects.create(**self.valid_payment_data)
        
        self.assertEqual(self.order.payments.count(), 1)
        self.assertEqual(self.order.payments.first(), payment)