from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.core.models import TimeStampedModel


class TransactionStatus(models.TextChoices):
    PENDING = "pending", _("Pending Collection")
    COLLECTED = "collected", _("Payment Collected")
    FAILED = "failed", _("Payment Failed")
    REFUNDED = "refunded", _("Payment Refunded")


class PaymentTransaction(TimeStampedModel):
    """
    Payment transaction record associated with an Order.
    Encapsulates payment status and transaction metadata across COD and online gateways.
    """

    order = models.ForeignKey("orders.Order", on_delete=models.CASCADE, related_name="transactions")
    transaction_id = models.CharField(max_length=100, unique=True)
    payment_method = models.CharField(max_length=50, default="cod")
    status = models.CharField(
        max_length=20,
        choices=TransactionStatus.choices,
        default=TransactionStatus.PENDING,
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        verbose_name = _("payment transaction")
        verbose_name_plural = _("payment transactions")
        ordering = ["-created_at"]

    def __str__(self):
        return f"Transaction {self.transaction_id} ({self.payment_method}) - {self.status}"
