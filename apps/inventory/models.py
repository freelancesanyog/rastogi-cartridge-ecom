from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.catalog.models import Product, ProductVariant
from apps.core.models import TimeStampedModel


class StockRecord(TimeStampedModel):
    """
    Inventory StockRecord tracking physical quantity, reserved quantity,
    and low stock threshold for a Product or ProductVariant.
    """

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="stock_records",
        null=True,
        blank=True,
    )
    variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.CASCADE,
        related_name="stock_records",
        null=True,
        blank=True,
    )
    quantity = models.PositiveIntegerField(
        default=0, help_text=_("Total physical stock quantity in warehouse.")
    )
    reserved_quantity = models.PositiveIntegerField(
        default=0, help_text=_("Stock currently reserved for pending orders.")
    )
    low_stock_threshold = models.PositiveIntegerField(
        default=5, help_text=_("Alert threshold for low stock warnings.")
    )

    class Meta:
        verbose_name = _("stock record")
        verbose_name_plural = _("stock records")
        ordering = ["-updated_at"]

    def __str__(self):
        target = self.variant or self.product
        return f"Stock for {target}: {self.available_quantity} available ({self.quantity} total)"

    def clean(self):
        if not self.product and not self.variant:
            raise ValidationError(_("StockRecord must be attached to either a Product or a ProductVariant."))
        if self.product and self.variant:
            if self.variant.product != self.product:
                raise ValidationError(_("Specified ProductVariant does not belong to the specified Product."))

    @property
    def available_quantity(self) -> int:
        return max(0, self.quantity - self.reserved_quantity)

    @property
    def is_low_stock(self) -> bool:
        return 0 < self.available_quantity <= self.low_stock_threshold

    @property
    def stock_status_label(self) -> str:
        if self.available_quantity == 0:
            return "out_of_stock"
        elif self.is_low_stock:
            return "low_stock"
        return "in_stock"
