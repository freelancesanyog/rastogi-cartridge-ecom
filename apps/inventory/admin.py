from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from apps.inventory.models import StockRecord


@admin.register(StockRecord)
class StockRecordAdmin(admin.ModelAdmin):
    """
    Admin interface for Shop Owners to view, adjust, and monitor product stock levels.
    """

    list_display = (
        "__str__",
        "product",
        "variant",
        "quantity",
        "reserved_quantity",
        "get_available_quantity",
        "low_stock_threshold",
        "get_stock_status_label",
        "updated_at",
    )
    list_filter = ("quantity", "reserved_quantity", "low_stock_threshold")
    search_fields = ("product__name", "product__sku", "variant__sku")
    autocomplete_fields = ["product", "variant"]
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        (
            None,
            {
                "fields": ("product", "variant"),
            },
        ),
        (
            _("Stock Adjustments"),
            {
                "fields": ("quantity", "reserved_quantity", "low_stock_threshold"),
            },
        ),
        (
            _("Timestamps"),
            {
                "classes": ("collapse",),
                "fields": ("created_at", "updated_at"),
            },
        ),
    )

    @admin.display(description=_("Available Quantity"))
    def get_available_quantity(self, obj):
        return obj.available_quantity

    @admin.display(description=_("Stock Status"))
    def get_stock_status_label(self, obj):
        return obj.stock_status_label.upper()
