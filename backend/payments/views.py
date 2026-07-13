from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
import json
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from .models import Payment
from .serializers import (
    PaymentSerializer,
    PaymentCreateSerializer,
    PaymentConfirmSerializer,
    PaymentStatusSerializer,
)
from .payment_strategies import PaymentStrategyFactory
from orders.models import Order
from orders.utils import reduce_order_stock


class PaymentInitializeView(APIView):
    """Initiate a payment for an order."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PaymentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            order = Order.objects.get(pk=serializer.validated_data["order_id"])
            if order.user != request.user and not request.user.is_staff:
                return Response(
                    {"detail": "You don't have permission to pay for this order."},
                    status=status.HTTP_403_FORBIDDEN,
                )
        except Order.DoesNotExist:
            return Response(
                {"detail": "Order not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        provider = serializer.validated_data["provider"]
        strategy = PaymentStrategyFactory.get_strategy(provider)

        payment_result = strategy.create_payment(
            order_id=order.id,
            amount=serializer.validated_data["amount"],
            currency=serializer.validated_data.get("currency", "bdt"),
        )

        if not payment_result.get("success"):
            return Response(
                {"detail": payment_result.get("error", "Payment creation failed.")},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payment = Payment.objects.create(
            order=order,
            provider=provider,
            transaction_id=payment_result["transaction_id"],
            status="pending",
            raw_responses=payment_result.get("raw_response"),
        )

        response_data = {
            "payment_id": payment.id,
            "transaction_id": payment_result["transaction_id"],
            "status": payment_result["status"],
        }

        if provider == "stripe":
            response_data["client_secret"] = payment_result.get("client_secret")
        elif provider == "bkash":
            response_data["checkout_url"] = payment_result.get("checkout_url")

        return Response(response_data, status=status.HTTP_201_CREATED)


class PaymentConfirmView(APIView):
    """Confirm/execute a payment."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PaymentConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            payment = Payment.objects.get(
                transaction_id=serializer.validated_data["transaction_id"]
            )
            if payment.order.user != request.user and not request.user.is_staff:
                return Response(
                    {"detail": "You don't have permission to confirm this payment."},
                    status=status.HTTP_403_FORBIDDEN,
                )
        except Payment.DoesNotExist:
            return Response(
                {"detail": "Payment not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        provider = serializer.validated_data["provider"]
        strategy = PaymentStrategyFactory.get_strategy(provider)

        confirm_result = strategy.confirm_payment(
            transaction_id=payment.transaction_id,
            payment_details=request.data,
        )

        if not confirm_result.get("success"):
            payment.status = "failed"
            payment.raw_responses = confirm_result.get("raw_response")
            payment.save()
            return Response(
                {"detail": confirm_result.get("error", "Payment confirmation failed.")},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payment.status = confirm_result.get("status", "success")
        payment.raw_responses = confirm_result.get("raw_response")
        payment.save()

        if payment.status == "success" and payment.order.status != "paid":
            payment.order.status = "paid"
            payment.order.save()
            reduce_order_stock(payment.order)

        return Response(
            {
                "transaction_id": payment.transaction_id,
                "status": payment.status,
                "order_id": payment.order.id,
            },
            status=status.HTTP_200_OK,
        )


class PaymentStatusView(APIView):
    """Query payment status."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PaymentStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            payment = Payment.objects.get(
                transaction_id=serializer.validated_data["transaction_id"]
            )
            if payment.order.user != request.user and not request.user.is_staff:
                return Response(
                    {"detail": "You don't have permission to view this payment."},
                    status=status.HTTP_403_FORBIDDEN,
                )
        except Payment.DoesNotExist:
            return Response(
                {"detail": "Payment not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        provider = serializer.validated_data["provider"]
        strategy = PaymentStrategyFactory.get_strategy(provider)

        status_result = strategy.query_payment_status(payment.transaction_id)

        if status_result.get("success"):
            payment.status = status_result.get("status", payment.status)
            payment.raw_responses = status_result.get("raw_response")
            payment.save()

        return Response(
            {
                "transaction_id": payment.transaction_id,
                "status": payment.status,
                "provider": payment.provider,
            },
            status=status.HTTP_200_OK,
        )
