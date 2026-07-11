from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            "id",
            "order",
            "provider",
            "transaction_id",
            "status",
            "raw_responses",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("transaction_id", "raw_responses", "created_at", "updated_at")


class PaymentCreateSerializer(serializers.Serializer):
    """Serializer for initiating a payment."""
    order_id = serializers.IntegerField()
    provider = serializers.ChoiceField(choices=["stripe", "bkash"])
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    currency = serializers.CharField(default="bdt", required=False)


class PaymentConfirmSerializer(serializers.Serializer):
    """Serializer for confirming a payment."""
    transaction_id = serializers.CharField()
    provider = serializers.ChoiceField(choices=["stripe", "bkash"])


class PaymentStatusSerializer(serializers.Serializer):
    """Serializer for querying payment status."""
    transaction_id = serializers.CharField()
    provider = serializers.ChoiceField(choices=["stripe", "bkash"])

