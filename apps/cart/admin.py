from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from apps.cart.models import Cart, CartItem
from apps.cart.services import CartService


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    fields = ("product", "variant", "quantity", "price_at_add", "get_line_total")
    readonly_fields = ("get_line_total",)
    autocomplete_fields = ["product", "variant"]

    @admin.display(description=_("Line Total"))
    def get_line_total(self, obj):
        return obj.line_total if obj.pk else "-"


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    """
    Admin view for Shopping Carts.
    """

    inlines = [CartItemInline]
    list_display = (
        "__str__",
        "user",
        "session_key",
        "is_active",
        "get_item_count",
        "get_subtotal",
        "updated_at",
    )
    list_filter = ("is_active", "created_at")
    search_fields = ("user__email", "session_key")
    readonly_fields = ("created_at", "updated_at")

    @admin.display(description=_("Item Count"))
    def get_item_count(self, obj):
        totals = CartService.get_cart_totals(obj)
        return totals["item_count"]

    @admin.display(description=_("Subtotal"))
    def get_subtotal(self, obj):
        totals = CartService.get_cart_totals(obj)
        return totals["subtotal"]
