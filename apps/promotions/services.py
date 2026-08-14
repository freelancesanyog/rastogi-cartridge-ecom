import logging
from decimal import Decimal

from django.core.exceptions import ValidationError

from apps.promotions.models import Coupon, DiscountType

logger = logging.getLogger(__name__)


class CouponService:
    """
    Domain service for validating promotional coupon codes and calculating discounts.
    """

    @staticmethod
    def validate_and_calculate_discount(code: str, cart_subtotal: Decimal) -> tuple[Coupon, Decimal]:
        """
        Validates a coupon code against active state, expiry, usage limits, and minimum order threshold,
        returning (Coupon, calculated_discount_amount).
        """
        if not code:
            raise ValidationError("Coupon code is required.")

        normalized_code = code.upper().strip()
        coupon = Coupon.objects.filter(code=normalized_code).first()

        if not coupon:
            raise ValidationError(f"Invalid coupon code '{code}'.")

        if not coupon.is_active:
            raise ValidationError("This coupon is no longer active.")

        if coupon.is_expired:
            raise ValidationError("This coupon has expired.")

        if coupon.is_usage_limit_reached:
            raise ValidationError("This coupon has reached its maximum usage limit.")

        if cart_subtotal < coupon.min_order_value:
            raise ValidationError(
                f"Minimum order subtotal of ${coupon.min_order_value} required for this coupon. Current subtotal is ${cart_subtotal}."
            )

        if coupon.discount_type == DiscountType.FLAT:
            discount_amount = min(coupon.discount_value, cart_subtotal)
        elif coupon.discount_type == DiscountType.PERCENTAGE:
            raw_discount = (cart_subtotal * coupon.discount_value) / Decimal("100.00")
            if coupon.max_discount_amount is not None:
                discount_amount = min(raw_discount, coupon.max_discount_amount)
            else:
                discount_amount = raw_discount
        else:
            discount_amount = Decimal("0.00")

        # Quantize to 2 decimal places
        discount_amount = discount_amount.quantize(Decimal("0.01"))
        return coupon, discount_amount
