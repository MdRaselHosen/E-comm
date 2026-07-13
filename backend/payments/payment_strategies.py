from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import stripe, requests
from django.conf import settings
from typing import Dict, Any
import requests
import uuid

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

    def create_payment(self, order_id: int, amount: float, currency: str = "bdt") -> Dict[str, Any]:
        try:
            intent = stripe.PaymentIntent.create(amount=int(amount * 100), currency=currency.lower(), metadata={"order_id": order_id})
            return {"success": True, "transaction_id": intent.id, "client_secret": intent.client_secret, "status": intent.status, "raw_response": intent.to_dict()}
        except stripe.error.StripeError as e:
            return {"success": False, "error": str(e)}


    def confirm_payment(self, transaction_id: str, payment_details: Dict[str, Any]) -> Dict[str, Any]:
        try:
            intent = stripe.PaymentIntent.retrieve(transaction_id)
            
            if intent.status == "succeeded":
                return {
                    "success": True, 
                    "transaction_id": intent.id, 
                    "status": "success", 
                    "raw_response": intent.to_dict()
                }
            else:
                return {
                    "success": False, 
                    "error": f"Stripe payment intent status is {intent.status}"
                }
                
        except stripe.error.StripeError as e:
            return {"success": False, "error": str(e)}

    def query_payment_status(self, transaction_id: str) -> Dict[str, Any]:
        try:
            intent = stripe.PaymentIntent.retrieve(transaction_id)
            return {"success": True, "status": self.status_map.get(intent.status, "pending"), "raw_response": intent.to_dict()}
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
        if settings.BKASH_IS_SANDBOX:
            self.base_url = "https://tokenized.sandbox.bka.sh/v1.2.0-beta"
        else:
            self.base_url = "https://tokenized.pay.bka.sh/v1.2.0-beta"
            
        self.app_key = settings.BKASH_APP_KEY
        self.app_secret = settings.BKASH_APP_SECRET
        self.headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "x-app-key": self.app_key
        }

    def _get_headers(self) -> Dict[str, str]:
        try:
            payload = {
                "app_key": self.app_key,
                "app_secret": self.app_secret
            }
            res = requests.post(
                f"{self.base_url}/tokenized/checkout/token/grant", 
                json=payload, 
                headers={
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "username": settings.BKASH_USERNAME,
                    "password": settings.BKASH_PASSWORD
                }
            )
            if res.status_code == 200:
                token_data = res.json()
                self.headers["Authorization"] = token_data.get("id_token")
        except Exception as e:
            print(f"bKash Token Auth Exception: {str(e)}")
            
        return self.headers

    def create_payment(self, order_id: int, amount: float, currency: str = "BDT") -> Dict[str, Any]:
        try:
            payload = {
                "mode": "0011",
                "payerReference": f"Wallet_Ref_{order_id}",
                "callbackURL": "http://localhost:5173/payment/bkash/callback", 
                "amount": str(amount),
                "currency": currency,
                "intent": "sale",
                "merchantInvoiceNumber": f"INV-{order_id}-{uuid.uuid4().hex[:6]}"
            }
            res = requests.post(
                f"{self.base_url}/tokenized/checkout/create", 
                json=payload, 
                headers=self._get_headers()
            )
            data = res.json()
            return {
                "success": "paymentID" in data, 
                "transaction_id": data.get("paymentID"), 
                "checkout_url": data.get("bkashURL"), 
                "status": "pending", 
                "raw_response": data
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def confirm_payment(self, transaction_id: str, payment_details: Dict[str, Any] = None) -> Dict[str, Any]:
        try:
            url = f"{self.base_url}/tokenized/checkout/execute"
            payload = {"paymentID": transaction_id}
            res = requests.post(url, json=payload, headers=self._get_headers())
            data = res.json()
            
            status_code = data.get("statusCode")
            is_success = status_code == "0000"
            
            return {
                "success": is_success,
                "transaction_id": transaction_id,
                "bank_trx_id": data.get("trxID") if is_success else None,
                "status": "success" if is_success else "failed",
                "message": data.get("statusMessage", "Payment Execution Failed"),
                "raw_response": data
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def query_payment_status(self, transaction_id: str) -> Dict[str, Any]:
        try:
            url = f"{self.base_url}/tokenized/checkout/payment/status"
            payload = {"paymentID": transaction_id}
            res = requests.post(url, json=payload, headers=self._get_headers())
            data = res.json()
            return {
                "success": res.status_code == 200, 
                "status": "success" if data.get("statusCode") == "0000" else "pending", 
                "raw_response": data
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def validate_webhook(self, payload: Any, signature: str) -> bool:
        return True

class PaymentStrategyFactory:
    _strategies = {"stripe": StripePaymentStrategy, "bkash": BkashPaymentStrategy}
    @classmethod
    def get_strategy(cls, provider: str) -> PaymentStrategy:
        if provider not in cls._strategies: raise ValueError(f"Unknown provider: {provider}")
        return cls._strategies[provider]()