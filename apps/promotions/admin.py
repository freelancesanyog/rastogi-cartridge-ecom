from django.contrib import admin

from apps.promotions.models import Coupon


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = (
        "code",
        "discount_type",
        "discount_value",
        "min_order_value",
        "used_count",
        "usage_limit",
        "is_active",
        "expiry_date",
        "created_at",
    )
    list_filter = ("discount_type", "is_active", "expiry_date", "created_at")
    search_fields = ("code",)
    readonly_fields = ("used_count", "created_at", "updated_at")
