from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.catalog.models import Product
from apps.core.models import TimeStampedModel


class ProductReview(TimeStampedModel):
    """
    Product review and star rating submitted by customers with admin moderation approval.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text=_("Star rating between 1 and 5."),
    )
    comment = models.TextField(help_text=_("Customer feedback comment."))
    is_approved = models.BooleanField(
        default=False,
        help_text=_("Moderation flag. Only approved reviews are visible publicly."),
    )

    class Meta:
        verbose_name = _("product review")
        verbose_name_plural = _("product reviews")
        unique_together = ("user", "product")
        ordering = ["-created_at"]

    def __str__(self):
        status_text = "Approved" if self.is_approved else "Pending"
        return f"{self.rating}★ Review for {self.product.name} by {self.user.email} ({status_text})"
