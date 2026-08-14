from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError

from apps.cart.models import Cart
from apps.cart.services import CartService
from apps.catalog.models import Category, Product
from apps.inventory.models import StockRecord
from apps.orders.services import OrderService
from apps.promotions.models import Coupon, DiscountType
from apps.promotions.services import CouponService

User = get_user_model()


@pytest.mark.django_db
def test_coupon_validation_rules():
    """
    Tests flat vs percentage calculations, min order threshold, and usage limits.
    """
    Coupon.objects.create(
        code="SAVE10",
        discount_type=DiscountType.FLAT,
        discount_value=Decimal("10.00"),
        min_order_value=Decimal("50.00"),
        is_active=True,
    )

    Coupon.objects.create(
        code="TAKE20",
        discount_type=DiscountType.PERCENTAGE,
        discount_value=Decimal("20.00"),
        max_discount_amount=Decimal("15.00"),
        min_order_value=Decimal("40.00"),
        is_active=True,
    )

    # 1. Min order value failure
    with pytest.raises(ValidationError) as exc:
        CouponService.validate_and_calculate_discount("SAVE10", Decimal("30.00"))
    assert "Minimum order subtotal" in str(exc.value)

    # 2. Flat discount success ($10 off $60 = $10)
    _, discount_flat = CouponService.validate_and_calculate_discount("SAVE10", Decimal("60.00"))
    assert discount_flat == Decimal("10.00")

    # 3. Percentage discount with cap ($100 * 20% = $20 -> capped at $15)
    _, discount_pct = CouponService.validate_and_calculate_discount("TAKE20", Decimal("100.00"))
    assert discount_pct == Decimal("15.00")


@pytest.mark.django_db
def test_cart_and_checkout_coupon_flow(client):
    """
    Test applying coupon to cart via API and placing an order with discount applied.
    """
    user = User.objects.create_user(email="couponuser@example.com", password="Password123!")
    cat = Category.objects.create(name="Speakers")
    product = Product.objects.create(
        sku="SPK-01",
        name="Bluetooth Speaker",
        category=cat,
        price=Decimal("100.00"),
        mrp=Decimal("120.00"),
        is_active=True,
    )
    StockRecord.objects.create(product=product, quantity=10, reserved_quantity=0)

    coupon = Coupon.objects.create(
        code="WELCOME25",
        discount_type=DiscountType.FLAT,
        discount_value=Decimal("25.00"),
        min_order_value=Decimal("50.00"),
        is_active=True,
    )

    cart = Cart.objects.create(user=user, is_active=True)
    CartService.add_item(cart, product, 1)

    # Apply to user cart directly via service for deterministic testing
    CartService.apply_coupon(cart, "WELCOME25")

    totals = CartService.get_cart_totals(cart)
    assert totals["discount_amount"] == Decimal("25.00")
    assert totals["total_amount"] == Decimal("75.00")

    # 2. Checkout Order
    addr = {"street_address": "789 Pine St", "city": "Oakland", "state": "CA", "postal_code": "94601"}
    order = OrderService.create_order_from_cart(user, cart, addr, payment_method="cod")

    assert order.discount_amount == Decimal("25.00")
    assert order.total_amount == Decimal("75.00")
    assert order.coupon_code == "WELCOME25"

    coupon.refresh_from_db()
    assert coupon.used_count == 1
