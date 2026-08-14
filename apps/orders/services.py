import logging
import uuid
from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from apps.cart.models import Cart
from apps.cart.services import CartService
from apps.inventory.models import StockRecord
from apps.inventory.services import InventoryService
from apps.orders.models import (
    Order,
    OrderItem,
    OrderStatus,
    OrderStatusHistory,
    PaymentMethodChoices,
)
from apps.orders.tasks import send_order_confirmation_task
from apps.payments.gateways.factory import PaymentGatewayFactory
from apps.payments.models import TransactionStatus

logger = logging.getLogger(__name__)


class OrderService:
    """
    Domain service layer for Order placement, COD threshold validation,
    concurrency-safe stock deduction, state transitions, and order cancellations.
    """

    @staticmethod
    @transaction.atomic
    def create_order_from_cart(user, cart: Cart, address_data: dict, payment_method: str = "cod") -> Order:
        """
        Creates an Order from a Cart, validates COD maximum threshold, snapshots historical product data,
        deducts stock via InventoryService select_for_update locks, applies coupon discounts, and registers payment transaction.
        """
        if not cart or not cart.items.exists():
            raise ValidationError("Cannot checkout with an empty shopping cart.")

        totals = CartService.get_cart_totals(cart)
        subtotal = totals["subtotal"]
        discount_amount = totals["discount_amount"]
        coupon_code = totals["coupon_code"] or ""

        shipping_fee = Decimal("0.00")
        tax = Decimal("0.00")
        total_amount = totals["total_amount"] + shipping_fee + tax

        # COD Max Limit Validation
        if payment_method.lower() == PaymentMethodChoices.COD:
            max_cod_limit = getattr(settings, "COD_MAX_ORDER_VALUE", Decimal("50000.00"))
            if total_amount > max_cod_limit:
                raise ValidationError(
                    f"Order total ({total_amount}) exceeds maximum threshold ({max_cod_limit}) for Cash on Delivery."
                )

        # Generate unique order number
        today_str = timezone.now().strftime("%Y%m%d")
        unique_suffix = uuid.uuid4().hex[:6].upper()
        order_number = f"ORD-{today_str}-{unique_suffix}"

        # Snapshot address
        shipping_snapshot = {
            "street_address": address_data.get("street_address", ""),
            "city": address_data.get("city", ""),
            "state": address_data.get("state", ""),
            "postal_code": address_data.get("postal_code", ""),
            "country": address_data.get("country", "United States"),
            "recipient_name": address_data.get("recipient_name", f"{user.first_name} {user.last_name}".strip()),
            "phone_number": address_data.get("phone_number", getattr(user, "phone_number", "")),
        }

        order = Order.objects.create(
            user=user,
            order_number=order_number,
            shipping_address=shipping_snapshot,
            status=OrderStatus.CONFIRMED,
            payment_status=TransactionStatus.PENDING,
            payment_method=payment_method.lower(),
            subtotal=subtotal,
            discount_amount=discount_amount,
            coupon_code=coupon_code,
            shipping_fee=shipping_fee,
            tax=tax,
            total_amount=total_amount,
        )

        # Process item snapshots & concurrency-safe stock deduction
        for cart_item in cart.items.select_related("product", "variant").all():
            target = cart_item.variant or cart_item.product
            stock_record = (
                StockRecord.objects.filter(variant=cart_item.variant).first()
                if cart_item.variant
                else StockRecord.objects.filter(product=cart_item.product).first()
            )

            if not stock_record:
                raise ValidationError(f"No inventory record found for item '{target}'.")

            InventoryService.deduct_stock(stock_record.id, cart_item.quantity, from_reserved=False)

            OrderItem.objects.create(
                order=order,
                stock_record_id=stock_record.id,
                product_name=cart_item.product.name,
                product_sku=cart_item.product.sku,
                variant_sku=cart_item.variant.sku if cart_item.variant else "",
                unit_price=cart_item.price_at_add,
                quantity=cart_item.quantity,
            )

        # Increment coupon used count if present
        if cart.coupon:
            cart.coupon.used_count += 1
            cart.coupon.save()

        # Invoke Payment Gateway Abstraction
        gateway = PaymentGatewayFactory.get_gateway(payment_method)
        gateway.process_payment(order)

        # Deactivate cart
        cart.is_active = False
        cart.save()

        # Record Initial Status History
        OrderStatusHistory.objects.create(
            order=order,
            from_status="CREATED",
            to_status=OrderStatus.CONFIRMED,
            comment="Order created and confirmed via COD checkout.",
            updated_by=user,
        )

        try:
            send_order_confirmation_task.delay(order.id)
        except Exception as exc:
            logger.error("Failed to enqueue order confirmation task: %s", exc)

        logger.info("Successfully created Order #%s for %s.", order.order_number, user.email)
        return order

    @staticmethod
    @transaction.atomic
    def transition_order_status(order: Order, new_status: str, comment: str = "", user=None) -> Order:
        old_status = order.status
        if old_status == new_status:
            return order

        order.status = new_status
        order.save()

        OrderStatusHistory.objects.create(
            order=order,
            from_status=old_status,
            to_status=new_status,
            comment=comment,
            updated_by=user,
        )
        logger.info("Order #%s transition: %s -> %s.", order.order_number, old_status, new_status)
        return order

    @staticmethod
    @transaction.atomic
    def mark_cod_payment_collected(order: Order, user=None) -> Order:
        order.payment_status = TransactionStatus.COLLECTED
        order.save()

        order.transactions.filter(payment_method="cod").update(status=TransactionStatus.COLLECTED)

        OrderStatusHistory.objects.create(
            order=order,
            from_status=order.status,
            to_status=order.status,
            comment="COD Payment marked as Collected on delivery.",
            updated_by=user,
        )
        logger.info("Order #%s COD payment collected.", order.order_number)
        return order

    @staticmethod
    @transaction.atomic
    def cancel_order(order: Order, reason: str = "", user=None) -> Order:
        unshipped_statuses = [
            OrderStatus.PENDING_CONFIRMATION,
            OrderStatus.CONFIRMED,
            OrderStatus.PROCESSING,
        ]
        if order.status not in unshipped_statuses:
            raise ValidationError(f"Order #{order.order_number} cannot be cancelled because its status is '{order.status}'.")

        old_status = order.status
        order.status = OrderStatus.CANCELLED
        order.cancellation_reason = reason
        order.save()

        for item in order.items.all():
            if item.stock_record_id:
                try:
                    InventoryService.restore_stock(item.stock_record_id, item.quantity)
                except Exception as exc:
                    logger.error("Failed to restore stock for item %s: %s", item.id, exc)

        OrderStatusHistory.objects.create(
            order=order,
            from_status=old_status,
            to_status=OrderStatus.CANCELLED,
            comment=f"Order cancelled. Reason: {reason}",
            updated_by=user,
        )
        logger.info("Order #%s cancelled and inventory restored.", order.order_number)
        return order
