from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status

from apps.catalog.models import Category, Product
from apps.inventory.models import StockRecord

User = get_user_model()


@pytest.mark.django_db
def test_cart_api_guest_and_item_operations(client):
    """
    Test cart API endpoints for guest session: list cart, add item, update item, remove item.
    """
    cat = Category.objects.create(name="Monitors")
    product = Product.objects.create(
        sku="MON-100",
        name="27 Inch Monitor",
        category=cat,
        price=Decimal("199.99"),
        mrp=Decimal("249.99"),
        is_active=True,
    )
    StockRecord.objects.create(
        product=product, quantity=15, reserved_quantity=0, low_stock_threshold=2
    )

    # 1. GET empty guest cart
    cart_url = reverse("cart:cart-list")
    res_list = client.get(cart_url, HTTP_X_SESSION_ID="guest_api_session")
    assert res_list.status_code == status.HTTP_200_OK
    assert res_list.data["item_count"] == 0

    # 2. Add item to cart
    add_url = reverse("cart:cart-add-item")
    res_add = client.post(
        add_url,
        {"product_id": product.id, "quantity": 2},
        format="json",
        HTTP_X_SESSION_ID="guest_api_session",
    )
    assert res_add.status_code == status.HTTP_200_OK
    assert res_add.data["item_count"] == 2
    item_id = res_add.data["items"][0]["id"]

    # 3. Update item quantity
    update_url = reverse("cart:cart-item-detail", kwargs={"item_id": item_id})
    res_update = client.patch(
        update_url,
        {"quantity": 5},
        content_type="application/json",
        HTTP_X_SESSION_ID="guest_api_session",
    )
    assert res_update.status_code == status.HTTP_200_OK
    assert res_update.data["item_count"] == 5

    # 4. Remove item from cart
    res_remove = client.delete(update_url, HTTP_X_SESSION_ID="guest_api_session")
    assert res_remove.status_code == status.HTTP_200_OK
    assert res_remove.data["item_count"] == 0


@pytest.mark.django_db
def test_cart_api_merge_endpoint(client):
    """
    Test POST /api/cart/merge/ endpoint for authenticated user.
    """
    User.objects.create_user(email="mergeapi@example.com", password="Password123!")

    # Login to get JWT
    login_url = reverse("users:login")
    login_res = client.post(
        login_url, {"email": "mergeapi@example.com", "password": "Password123!"}, format="json"
    )
    access_token = login_res.data["access"]
    headers = {"HTTP_AUTHORIZATION": f"Bearer {access_token}"}

    merge_url = reverse("cart:cart-merge-cart")
    res = client.post(
        merge_url, {"session_key": "non_existent_session"}, format="json", **headers
    )
    assert res.status_code == status.HTTP_200_OK
