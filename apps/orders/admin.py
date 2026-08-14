from django.contrib import admin, messages
from django.utils.translation import gettext_lazy as _

from apps.orders.models import Order, OrderItem, OrderStatus, OrderStatusHistory
from apps.orders.services import OrderService
from apps.payments.models import TransactionStatus


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    fields = ("product_name", "product_sku", "variant_sku", "unit_price", "quantity", "get_line_total")
    readonly_fields = ("product_name", "product_sku", "variant_sku", "unit_price", "quantity", "get_line_total")

    @admin.display(description=_("Line Total"))
    def get_line_total(self, obj):
        return obj.line_total if obj.pk else "-"


class OrderStatusHistoryInline(admin.TabularInline):
    model = OrderStatusHistory
    extra = 0
    fields = ("from_status", "to_status", "comment", "updated_by", "created_at")
    readonly_fields = ("from_status", "to_status", "comment", "updated_by", "created_at")


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    """
    Shop Owner Order Management Admin.
    """

    inlines = [OrderItemInline, OrderStatusHistoryInline]
    list_display = (
        "order_number",
        "user",
        "status",
        "payment_status",
        "payment_method",
        "total_amount",
        "created_at",
    )
    list_filter = ("status", "payment_status", "payment_method", "created_at")
    search_fields = ("order_number", "user__email", "user__first_name", "user__last_name")
    readonly_fields = ("order_number", "subtotal", "shipping_fee", "tax", "total_amount", "created_at", "updated_at")

    actions = ["action_mark_cod_collected", "action_mark_shipped", "action_mark_delivered"]

    @admin.action(description=_("Mark selected COD payments as Collected"))
    def action_mark_cod_collected(self, request, queryset):
        count = 0
        for order in queryset.filter(payment_status=TransactionStatus.PENDING):
            OrderService.mark_cod_payment_collected(order, user=request.user)
            count += 1
        self.message_user(request, f"Marked {count} order(s) as COD payment collected.", messages.SUCCESS)

    @admin.action(description=_("Mark selected orders as Shipped"))
    def action_mark_shipped(self, request, queryset):
        count = 0
        for order in queryset:
            OrderService.transition_order_status(order, OrderStatus.SHIPPED, comment="Marked as Shipped by admin.", user=request.user)
            count += 1
        self.message_user(request, f"Updated {count} order(s) to SHIPPED status.", messages.SUCCESS)

    @admin.action(description=_("Mark selected orders as Delivered"))
    def action_mark_delivered(self, request, queryset):
        count = 0
        for order in queryset:
            OrderService.transition_order_status(order, OrderStatus.DELIVERED, comment="Marked as Delivered by admin.", user=request.user)
            count += 1
        self.message_user(request, f"Updated {count} order(s) to DELIVERED status.", messages.SUCCESS)
