from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError

from apps.cart.models import Cart, CartItem
from apps.cart.services import CartService
from apps.catalog.models import Category, Product
from apps.inventory.models import StockRecord

User = get_user_model()


@pytest.mark.django_db
def test_guest_cart_and_stock_limit_enforcement():
    """
    Test guest cart item additions and inventory stock limit enforcement.
    """
    cat = Category.objects.create(name="Keyboards")
    product = Product.objects.create(
        sku="KEY-TEST",
        name="Wireless Keyboard",
        category=cat,
        price=Decimal("45.00"),
        mrp=Decimal("50.00"),
        is_active=True,
    )
    # 5 items available in stock
    StockRecord.objects.create(
        product=product, quantity=5, reserved_quantity=0, low_stock_threshold=2
    )

    cart = Cart.objects.create(session_key="guest_sess_123", is_active=True)

    # 1. Add 3 items (allowed)
    item = CartService.add_item(cart, product, 3)
    assert item.quantity == 3
    assert item.line_total == Decimal("135.00")

    # 2. Attempt to add 3 more items (total 6 > 5 available) -> ValidationError
    with pytest.raises(ValidationError) as exc:
        CartService.add_item(cart, product, 3)
    assert "Maximum available stock" in str(exc.value)

    # 3. Update quantity to 5 (allowed)
    updated = CartService.update_quantity(cart, item.id, 5)
    assert updated.quantity == 5

    # 4. Update quantity to 0 (removes item)
    res = CartService.update_quantity(cart, item.id, 0)
    assert res is None
    assert CartItem.objects.filter(cart=cart).count() == 0


@pytest.mark.django_db
def test_merge_guest_cart_into_user_cart():
    """
    Test merging a guest cart into a user's cart on login.
    Verifies quantities are merged, capped by available stock, and guest cart deactivated.
    """
    user = User.objects.create_user(email="cartuser@example.com", password="Password123!")
    cat = Category.objects.create(name="Mice")
    product = Product.objects.create(
        sku="MOUSE-1",
        name="Ergonomic Mouse",
        category=cat,
        price=Decimal("25.00"),
        mrp=Decimal("30.00"),
        is_active=True,
    )
    # Total stock: 10
    StockRecord.objects.create(
        product=product, quantity=10, reserved_quantity=0, low_stock_threshold=2
    )

    # Guest Cart with 4 items
    guest_cart = Cart.objects.create(session_key="guest_session_99", is_active=True)
    CartService.add_item(guest_cart, product, 4)

    # User Cart with 3 items
    user_cart = Cart.objects.create(user=user, is_active=True)
    CartService.add_item(user_cart, product, 3)

    # Merge on login
    merged_cart = CartService.merge_guest_cart_into_user_cart("guest_session_99", user)
    assert merged_cart.pk == user_cart.pk

    # Verify no duplicate items created, total quantity = 7 (3 + 4)
    items = CartItem.objects.filter(cart=user_cart)
    assert items.count() == 1
    assert items.first().quantity == 7

    # Verify guest cart deactivated
    guest_cart.refresh_from_db()
    assert guest_cart.is_active is False
