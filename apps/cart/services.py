import logging
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction

from apps.cart.models import Cart, CartItem
from apps.catalog.models import Product, ProductVariant
from apps.catalog.services import CatalogService
from apps.inventory.services import InventoryService
from apps.promotions.services import CouponService

logger = logging.getLogger(__name__)


class CartService:
    """
    Domain service layer for managing guest & authenticated shopping carts,
    inventory stock limit validation, cart merging, and coupon discount application.
    """

    @staticmethod
    def get_or_create_cart(request) -> Cart:
        """
        Retrieves or creates an active Cart based on request user or guest session key.
        """
        user = request.user if getattr(request, "user", None) and request.user.is_authenticated else None

        if user:
            cart, _ = Cart.objects.get_or_create(user=user, is_active=True)
            return cart

        session_key = getattr(request.session, "session_key", None)
        if not session_key:
            if hasattr(request.session, "create"):
                request.session.create()
                session_key = request.session.session_key
            else:
                session_key = request.headers.get("X-Session-ID", "guest_session")

        cart, _ = Cart.objects.get_or_create(session_key=session_key, user=None, is_active=True)
        return cart

    @staticmethod
    @transaction.atomic
    def add_item(cart: Cart, product: Product, quantity: int, variant: ProductVariant = None) -> CartItem:
        if quantity <= 0:
            raise ValidationError("Quantity to add must be greater than zero.")

        target = variant or product
        stock_info = InventoryService.get_stock_status(target)

        if not stock_info["in_stock"]:
            raise ValidationError("Selected item is currently out of stock.")

        available_stock = stock_info["available_quantity"]

        existing_item = CartItem.objects.filter(cart=cart, product=product, variant=variant).first()
        current_cart_qty = existing_item.quantity if existing_item else 0
        new_total_qty = current_cart_qty + quantity

        if new_total_qty > available_stock:
            raise ValidationError(
                f"Cannot add {quantity} units. Maximum available stock for this item is {available_stock}."
            )

        effective_price = CatalogService.calculate_effective_price(product, variant)

        if existing_item:
            existing_item.quantity = new_total_qty
            existing_item.price_at_add = effective_price
            existing_item.save()
            return existing_item

        item = CartItem.objects.create(
            cart=cart,
            product=product,
            variant=variant,
            quantity=new_total_qty,
            price_at_add=effective_price,
        )
        return item

    @staticmethod
    @transaction.atomic
    def update_quantity(cart: Cart, cart_item_id: int, quantity: int) -> CartItem:
        try:
            item = CartItem.objects.get(pk=cart_item_id, cart=cart)
        except CartItem.DoesNotExist as exc:
            raise ValidationError(f"Cart item {cart_item_id} not found in current cart.") from exc

        if quantity <= 0:
            item.delete()
            return None

        target = item.variant or item.product
        stock_info = InventoryService.get_stock_status(target)
        available_stock = stock_info["available_quantity"]

        if quantity > available_stock:
            raise ValidationError(
                f"Cannot set quantity to {quantity}. Maximum available stock is {available_stock}."
            )

        item.quantity = quantity
        item.save()
        return item

    @staticmethod
    @transaction.atomic
    def remove_item(cart: Cart, cart_item_id: int):
        CartItem.objects.filter(pk=cart_item_id, cart=cart).delete()

    @staticmethod
    def get_cart_totals(cart: Cart) -> dict:
        """
        Calculates subtotal, discount_amount, total_amount, and total item count for a cart.
        """
        if not cart:
            return {
                "subtotal": Decimal("0.00"),
                "discount_amount": Decimal("0.00"),
                "total_amount": Decimal("0.00"),
                "item_count": 0,
                "coupon_code": None,
            }

        items = cart.items.select_related("product", "variant").all()
        subtotal = sum(item.line_total for item in items)
        item_count = sum(item.quantity for item in items)

        discount_amount = Decimal("0.00")
        coupon_code = None

        if cart.coupon:
            try:
                _, discount_amount = CouponService.validate_and_calculate_discount(cart.coupon.code, subtotal)
                coupon_code = cart.coupon.code
            except ValidationError:
                # Auto detach invalid/expired coupon
                cart.coupon = None
                cart.save()

        total_amount = max(Decimal("0.00"), subtotal - discount_amount)

        return {
            "subtotal": subtotal,
            "discount_amount": discount_amount,
            "total_amount": total_amount,
            "item_count": item_count,
            "coupon_code": coupon_code,
        }

    @staticmethod
    def apply_coupon(cart: Cart, coupon_code: str) -> Cart:
        """
        Validates and attaches a coupon code to the cart.
        """
        totals = CartService.get_cart_totals(cart)
        coupon, _ = CouponService.validate_and_calculate_discount(coupon_code, totals["subtotal"])
        cart.coupon = coupon
        cart.save()
        logger.info("Coupon %s applied to Cart #%s.", coupon.code, cart.id)
        return cart

    @staticmethod
    def remove_coupon(cart: Cart) -> Cart:
        """
        Removes currently attached coupon from the cart.
        """
        cart.coupon = None
        cart.save()
        return cart

    @staticmethod
    @transaction.atomic
    def merge_guest_cart_into_user_cart(session_key: str, user) -> Cart:
        if not session_key or not user:
            return None

        guest_cart = Cart.objects.filter(session_key=session_key, user=None, is_active=True).first()
        if not guest_cart or not guest_cart.items.exists():
            return None

        user_cart, _ = Cart.objects.get_or_create(user=user, is_active=True)

        for guest_item in guest_cart.items.select_related("product", "variant").all():
            target = guest_item.variant or guest_item.product
            stock_info = InventoryService.get_stock_status(target)
            available_stock = stock_info["available_quantity"]

            existing_user_item = CartItem.objects.filter(
                cart=user_cart, product=guest_item.product, variant=guest_item.variant
            ).first()

            if existing_user_item:
                merged_qty = existing_user_item.quantity + guest_item.quantity
                clamped_qty = min(merged_qty, available_stock)
                if clamped_qty > 0:
                    existing_user_item.quantity = clamped_qty
                    existing_user_item.save()
            else:
                clamped_qty = min(guest_item.quantity, available_stock)
                if clamped_qty > 0:
                    CartItem.objects.create(
                        cart=user_cart,
                        product=guest_item.product,
                        variant=guest_item.variant,
                        quantity=clamped_qty,
                        price_at_add=guest_item.price_at_add,
                    )

        if guest_cart.coupon and not user_cart.coupon:
            user_cart.coupon = guest_cart.coupon
            user_cart.save()

        guest_cart.is_active = False
        guest_cart.save()
        logger.info("Merged guest cart %s into user cart for %s.", session_key, user.email)
        return user_cart
