import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .models import Payment
from .payment_strategies import StripePaymentStrategy
from orders.utils import reduce_order_stock  # Add your stock reduction helper path here
from rest_framework.permissions import AllowAny

@method_decorator(csrf_exempt, name="dispatch")
class StripeWebhookView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        if not StripePaymentStrategy().validate_webhook(request.body, request.META.get("HTTP_STRIPE_SIGNATURE")):
            return Response({"detail": "Invalid signature."}, status=status.HTTP_400_BAD_REQUEST)
        
        event = json.loads(request.body)
        if event.get("type") == "payment_intent.succeeded":
            intent = event["data"]["object"]
            self.process_success(intent["id"], intent)
        return Response({"status": "success"})

    def process_success(self, tx_id, raw):
        payment = Payment.objects.filter(transaction_id=tx_id).first()
        if payment and payment.status != "success":
            payment.status, payment.raw_responses = "success", raw
            payment.save()
            if payment.order.status != "paid":
                payment.order.status = "paid"
                payment.order.save()
                reduce_order_stock(payment.order)

@method_decorator(csrf_exempt, name="dispatch")
class BkashWebhookView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        tx_id, code = request.data.get("paymentID"), request.data.get("statusCode")
        payment = Payment.objects.filter(transaction_id=tx_id).first()
        if payment:
            payment.status = "success" if code == "0000" else "failed"
            payment.raw_responses = request.data
            payment.save()
            if payment.status == "success" and payment.order.status != "paid":
                payment.order.status = "paid"
                payment.order.save()
                reduce_order_stock(payment.order)
        return Response({"status": "success"})