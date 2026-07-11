from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import stripe, requests
from django.conf import settings

class PaymentStrategy(ABC):
    @abstractmethod
    def create_payment(self, order_id: int, amount: float, currency: str = "bdt") -> Dict[str, Any]: pass
    @abstractmethod
    def confirm_payment(self, transaction_id: str, payment_details: Dict[str, Any]) -> Dict[str, Any]: pass
    @abstractmethod
    def query_payment_status(self, transaction_id: str) -> Dict[str, Any]: pass
    @abstractmethod
    def validate_webhook(self, payload: Any, signature: str) -> bool: pass

class StripePaymentStrategy(PaymentStrategy):
    def __init__(self):
        stripe.api_key = settings.STRIPE_SECRET_KEY
        self.status_map = {"succeeded": "success", "canceled": "failed"}

    def create_payment(self, order_id: int, amount: float, currency: str = "USD") -> Dict[str, Any]:
        try:
            intent = stripe.PaymentIntent.create(amount=int(amount * 100), currency=currency.lower(), metadata={"order_id": order_id})
            return {"success": True, "transaction_id": intent.id, "client_secret": intent.client_secret, "status": intent.status, "raw_response": intent.to_dict()}
        except stripe.error.StripeError as e:
            return {"success": False, "error": str(e)}

    def confirm_payment(self, transaction_id: str, payment_details: Dict[str, Any]) -> Dict[str, Any]:
        try:
            intent = stripe.PaymentIntent.retrieve(transaction_id)
            return {"success": intent.status == "succeeded", "transaction_id": intent.id, "status": self.status_map.get(intent.status, "pending"), "raw_response": intent.to_dict_recursive()}
        except stripe.error.StripeError as e:
            return {"success": False, "error": str(e)}

    def query_payment_status(self, transaction_id: str) -> Dict[str, Any]:
        try:
            intent = stripe.PaymentIntent.retrieve(transaction_id)
            return {"success": True, "status": self.status_map.get(intent.status, "pending"), "raw_response": intent.to_dict_recursive()}
        except stripe.error.StripeError as e:
            return {"success": False, "error": str(e)}

    def validate_webhook(self, payload: bytes, signature: str) -> bool:
        try:
            stripe.Webhook.construct_event(payload, signature, settings.STRIPE_WEBHOOK_SECRET)
            return True
        except (ValueError, stripe.error.SignatureVerificationError):
            return False

class BkashPaymentStrategy(PaymentStrategy):
    def __init__(self):
        self.base_url = "https://checkout.sandbox.bkash.com"
        self.app_key, self.app_secret = settings.BKASH_APP_KEY, settings.BKASH_APP_SECRET
        self.headers = {"x-app-key": self.app_key}

    def _get_headers(self) -> Dict[str, str]:
        res = requests.post(f"{self.base_url}/api/GetToken", json={"app_key": self.app_key, "app_secret": self.app_secret})
        if res.status_code == 200:
            self.headers["authorization"] = res.json().get("id_token")
        return self.headers

    def create_payment(self, order_id: int, amount: float, currency: str = "BDT") -> Dict[str, Any]:
        try:
            res = requests.post(f"{self.base_url}/api/Checkout/Initialize/sendOTP", json={"amount": amount, "currency": currency, "orderID": str(order_id), "callbackURL": "https://your-domain.com/api/callback/"}, headers=self._get_headers())
            data = res.json()
            return {"success": res.status_code == 200, "transaction_id": data.get("paymentID"), "checkout_url": data.get("bkashURL"), "status": "pending", "raw_response": data}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def confirm_payment(self, transaction_id: str, payment_details: Dict[str, Any]) -> Dict[str, Any]:
        try:
            res = requests.post(f"{self.base_url}/api/Checkout/Complete", json={"paymentID": transaction_id}, headers=self._get_headers())
            data = res.json()
            return {"success": data.get("statusCode") == "0000", "transaction_id": transaction_id, "status": "success" if data.get("statusCode") == "0000" else "failed", "raw_response": data}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def query_payment_status(self, transaction_id: str) -> Dict[str, Any]:
        try:
            res = requests.get(f"{self.base_url}/api/Checkout/Payment/Status/{transaction_id}", headers=self._get_headers())
            data = res.json()
            return {"success": res.status_code == 200, "status": "success" if data.get("statusCode") == "0000" else "pending", "raw_response": data}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def validate_webhook(self, payload: Dict[str, Any], signature: str) -> bool:
        return True

class PaymentStrategyFactory:
    _strategies = {"stripe": StripePaymentStrategy, "bkash": BkashPaymentStrategy}
    @classmethod
    def get_strategy(cls, provider: str) -> PaymentStrategy:
        if provider not in cls._strategies: raise ValueError(f"Unknown provider: {provider}")
        return cls._strategies[provider]()