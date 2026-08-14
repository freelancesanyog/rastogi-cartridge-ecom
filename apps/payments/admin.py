from django.contrib import admin

from apps.payments.models import PaymentTransaction


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = ("transaction_id", "order", "payment_method", "amount", "status", "created_at")
    list_filter = ("payment_method", "status", "created_at")
    search_fields = ("transaction_id", "order__order_number", "order__user__email")
    readonly_fields = ("created_at", "updated_at")
