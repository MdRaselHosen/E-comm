from django.urls import path
from .views import (
    PaymentInitializeView,
    PaymentConfirmView,
    PaymentStatusView,
)
from .webhooks import StripeWebhookView, BkashWebhookView

urlpatterns = [
    path("payments/initialize/", PaymentInitializeView.as_view(), name="payment_initialize"),
    path("payments/confirm/", PaymentConfirmView.as_view(), name="payment_confirm"),
    path("payments/status/", PaymentStatusView.as_view(), name="payment_status"),
    path("payments/webhooks/stripe/", StripeWebhookView.as_view(), name="stripe_webhook"),
    path("payments/webhooks/bkash/", BkashWebhookView.as_view(), name="bkash_webhook"),
]
