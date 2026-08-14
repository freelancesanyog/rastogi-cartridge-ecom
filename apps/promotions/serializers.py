from rest_framework import serializers

from apps.promotions.models import Coupon


class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = (
            "id",
            "code",
            "discount_type",
            "discount_value",
            "min_order_value",
            "max_discount_amount",
            "expiry_date",
            "is_active",
        )


class CouponApplySerializer(serializers.Serializer):
    code = serializers.CharField(required=True, min_length=2)
