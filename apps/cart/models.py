from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.catalog.models import Product, ProductVariant
from apps.core.models import TimeStampedModel


class Cart(TimeStampedModel):
    """
    Shopping Cart container. Can be owned by an authenticated User
    or a guest identified by session_key. Supports promotional coupon attachment.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="carts",
    )
    session_key = models.CharField(max_length=100, null=True, blank=True, db_index=True)
    coupon = models.ForeignKey(
        "promotions.Coupon",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="carts",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = _("cart")
        verbose_name_plural = _("carts")
        ordering = ["-updated_at"]

    def __str__(self):
        owner = self.user.email if self.user else f"Guest ({self.session_key})"
        return f"Cart #{self.pk} for {owner}"


class CartItem(TimeStampedModel):
    """
    Individual item inside a Shopping Cart.
    """

    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="cart_items")
    variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="cart_items",
    )
    quantity = models.PositiveIntegerField(default=1)
    price_at_add = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        verbose_name = _("cart item")
        verbose_name_plural = _("cart items")
        unique_together = ("cart", "product", "variant")
        ordering = ["created_at"]

    def __str__(self):
        item_name = self.variant or self.product
        return f"{self.quantity}x {item_name} in Cart #{self.cart_id}"

    @property
    def line_total(self) -> Decimal:
        return self.quantity * self.price_at_add
