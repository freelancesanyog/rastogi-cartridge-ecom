from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.core.models import TimeStampedModel
from apps.payments.models import TransactionStatus


class OrderStatus(models.TextChoices):
    PENDING_CONFIRMATION = "pending_confirmation", _("Pending Confirmation")
    CONFIRMED = "confirmed", _("Order Confirmed")
    PROCESSING = "processing", _("Processing / Packing")
    SHIPPED = "shipped", _("Shipped / Dispatched")
    DELIVERED = "delivered", _("Delivered")
    CANCELLED = "cancelled", _("Cancelled")
    RETURNED = "returned", _("Returned")


class PaymentMethodChoices(models.TextChoices):
    COD = "cod", _("Cash on Delivery (COD)")
    ONLINE_GATEWAY = "online_gateway", _("Online Payment Gateway")


class Order(TimeStampedModel):
    """
    Primary Order entity storing user details, status lifecycle, total pricing,
    coupon discount metadata, and shipping address snapshot.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="orders",
    )
    order_number = models.CharField(max_length=50, unique=True, db_index=True)
    shipping_address = models.JSONField(
        help_text=_("Snapshot of delivery address at time of order placement.")
    )
    status = models.CharField(
        max_length=30,
        choices=OrderStatus.choices,
        default=OrderStatus.CONFIRMED,
        db_index=True,
    )
    payment_status = models.CharField(
        max_length=20,
        choices=TransactionStatus.choices,
        default=TransactionStatus.PENDING,
        db_index=True,
    )
    payment_method = models.CharField(
        max_length=30,
        choices=PaymentMethodChoices.choices,
        default=PaymentMethodChoices.COD,
    )

    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    coupon_code = models.CharField(max_length=50, blank=True)
    shipping_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)

    cancellation_reason = models.TextField(blank=True)

    class Meta:
        verbose_name = _("order")
        verbose_name_plural = _("orders")
        ordering = ["-created_at"]

    def __str__(self):
        return f"Order #{self.order_number} ({self.status})"


class OrderItem(TimeStampedModel):
    """
    Historical snapshot of an item inside an order.
    Never references live catalog product tables for historical data integrity.
    """

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    stock_record_id = models.PositiveIntegerField(
        null=True, blank=True, help_text=_("StockRecord ID for inventory restoration on cancellation.")
    )
    product_name = models.CharField(max_length=255)
    product_sku = models.CharField(max_length=60)
    variant_sku = models.CharField(max_length=60, blank=True)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        verbose_name = _("order item")
        verbose_name_plural = _("order items")
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.quantity}x {self.product_name} ({self.product_sku})"

    @property
    def line_total(self) -> Decimal:
        return self.quantity * self.unit_price


class OrderStatusHistory(TimeStampedModel):
    """
    Audit log tracking order status transitions.
    """

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="status_history")
    from_status = models.CharField(max_length=30)
    to_status = models.CharField(max_length=30)
    comment = models.CharField(max_length=255, blank=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = _("order status history")
        verbose_name_plural = _("order status histories")
        ordering = ["-created_at"]

    def __str__(self):
        return f"Order #{self.order.order_number}: {self.from_status} -> {self.to_status}"
