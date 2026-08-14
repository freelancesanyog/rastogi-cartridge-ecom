from decimal import Decimal

from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from apps.core.models import TimeStampedModel


class DiscountType(models.TextChoices):
    FLAT = "flat", _("Flat Amount (₹)")
    PERCENTAGE = "percentage", _("Percentage (%)")


class Coupon(TimeStampedModel):
    """
    Promotional Coupon model supporting flat/percentage discounts, minimum order threshold,
    percentage cap, usage limits, and expiration.
    """

    code = models.CharField(max_length=50, unique=True, db_index=True)
    discount_type = models.CharField(
        max_length=20,
        choices=DiscountType.choices,
        default=DiscountType.FLAT,
    )
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    min_order_value = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    max_discount_amount = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True, help_text=_("Optional cap for percentage discount.")
    )
    expiry_date = models.DateTimeField(null=True, blank=True)
    usage_limit = models.PositiveIntegerField(
        null=True, blank=True, help_text=_("Maximum redemptions allowed. Leave empty for unlimited.")
    )
    used_count = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = _("coupon")
        verbose_name_plural = _("coupons")
        ordering = ["-created_at"]

    def __str__(self):
        val_str = f"${self.discount_value}" if self.discount_type == DiscountType.FLAT else f"{self.discount_value}%"
        return f"Coupon {self.code} ({val_str} off)"

    def clean(self):
        if self.code:
            self.code = self.code.upper().strip()

    def save(self, *args, **kwargs):
        if self.code:
            self.code = self.code.upper().strip()
        super().save(*args, **kwargs)

    @property
    def is_expired(self) -> bool:
        if self.expiry_date and timezone.now() > self.expiry_date:
            return True
        return False

    @property
    def is_usage_limit_reached(self) -> bool:
        if self.usage_limit is not None and self.used_count >= self.usage_limit:
            return True
        return False

    @property
    def is_valid_coupon(self) -> bool:
        return self.is_active and not self.is_expired and not self.is_usage_limit_reached
