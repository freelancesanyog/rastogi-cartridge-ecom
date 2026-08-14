import logging

from celery import shared_task
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


@shared_task
def send_order_confirmation_task(order_id: int):
    """
    Celery task generating order confirmation details and sending email notification to the customer.
    """
    from apps.orders.models import Order

    try:
        order = Order.objects.select_related("user").prefetch_related("items").get(pk=order_id)
    except Order.DoesNotExist:
        logger.error("Order confirmation task failed: Order ID %s not found.", order_id)
        return

    item_lines = [
        f"- {item.quantity}x {item.product_name} (${item.unit_price} each = ${item.line_total})"
        for item in order.items.all()
    ]
    items_summary = "\n".join(item_lines)

    message = (
        f"Thank you for your order, {order.user.first_name or order.user.email}!\n\n"
        f"Order Number: #{order.order_number}\n"
        f"Payment Method: {order.get_payment_method_display()}\n"
        f"Total Amount: ${order.total_amount}\n\n"
        f"Items Ordered:\n{items_summary}\n\n"
        f"Delivery Address:\n"
        f"{order.shipping_address.get('street_address')}, {order.shipping_address.get('city')}, "
        f"{order.shipping_address.get('state')} {order.shipping_address.get('postal_code')}\n\n"
        f"We are processing your order and will dispatch it shortly.\n"
    )

    send_mail(
        subject=f"Order Confirmation - #{order.order_number}",
        message=message,
        from_email=None,
        recipient_list=[order.user.email],
        fail_silently=False,
    )
    logger.info("Order confirmation email successfully dispatched for Order #%s.", order.order_number)
    return f"Confirmation sent for Order #{order.order_number}"
