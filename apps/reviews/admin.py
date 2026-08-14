from django.contrib import admin, messages
from django.utils.translation import gettext_lazy as _

from apps.reviews.models import ProductReview


@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    """
    Shop Owner Moderation Dashboard for Customer Product Reviews.
    """

    list_display = ("product", "user", "rating", "is_approved", "created_at")
    list_filter = ("is_approved", "rating", "created_at")
    search_fields = ("product__name", "product__sku", "user__email", "comment")
    readonly_fields = ("user", "product", "created_at", "updated_at")

    actions = ["action_approve_reviews", "action_unapprove_reviews"]

    @admin.action(description=_("Approve selected product reviews"))
    def action_approve_reviews(self, request, queryset):
        count = queryset.update(is_approved=True)
        self.message_user(request, f"Approved {count} review(s).", messages.SUCCESS)

    @admin.action(description=_("Unapprove selected product reviews"))
    def action_unapprove_reviews(self, request, queryset):
        count = queryset.update(is_approved=False)
        self.message_user(request, f"Unapproved {count} review(s).", messages.SUCCESS)
