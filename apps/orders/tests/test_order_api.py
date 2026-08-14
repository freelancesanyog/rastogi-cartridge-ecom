from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status

from apps.cart.models import Cart
from apps.cart.services import CartService
from apps.catalog.models import Category, Product
from apps.inventory.models import StockRecord
from apps.orders.models import OrderStatus

User = get_user_model()


@pytest.mark.django_db
def test_order_checkout_history_and_cancel_api(client):
    """
    Test complete order API flow: checkout -> list history -> get detail -> cancel order.
    """
    user = User.objects.create_user(email="orderapi@example.com", password="Password123!")

    cat = Category.objects.create(name="Keyboards")
    product = Product.objects.create(
        sku="KEY-API",
        name="RGB Mechanical Keyboard",
        category=cat,
        price=Decimal("120.00"),
        mrp=Decimal("140.00"),
        is_active=True,
    )
    StockRecord.objects.create(
        product=product, quantity=10, reserved_quantity=0, low_stock_threshold=2
    )

    # 1. Login to get JWT
    login_res = client.post(
        reverse("users:login"),
        {"email": "orderapi@example.com", "password": "Password123!"},
        format="json",
    )
    access_token = login_res.data["access"]

    # 2. Add item to user cart
    cart = Cart.objects.create(user=user, is_active=True)
    CartService.add_item(cart, product, 2)

    # 3. Checkout API
    checkout_url = reverse("orders:order-checkout")
    checkout_data = {
        "shipping_address": {
            "street_address": "456 Market St",
            "city": "San Francisco",
            "state": "CA",
            "postal_code": "94105",
            "country": "United States",
        },
        "payment_method": "cod",
    }
    res_checkout = client.post(
        checkout_url,
        checkout_data,
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {access_token}",
    )
    assert res_checkout.status_code == status.HTTP_201_CREATED
    order_number = res_checkout.data["order_number"]

    # 4. List order history
    list_url = reverse("orders:order-list")
    res_list = client.get(list_url, HTTP_AUTHORIZATION=f"Bearer {access_token}")
    assert res_list.status_code == status.HTTP_200_OK
    assert res_list.data["count"] == 1

    # 5. Detail view
    detail_url = reverse("orders:order-detail", kwargs={"order_number": order_number})
    res_detail = client.get(detail_url, HTTP_AUTHORIZATION=f"Bearer {access_token}")
    assert res_detail.status_code == status.HTTP_200_OK
    assert res_detail.data["order_number"] == order_number

    # 6. Cancel Order API
    cancel_url = reverse("orders:order-cancel-order", kwargs={"order_number": order_number})
    res_cancel = client.post(
        cancel_url,
        {"reason": "Found better price elsewhere"},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {access_token}",
    )
    assert res_cancel.status_code == status.HTTP_200_OK
    assert res_cancel.data["status"] == OrderStatus.CANCELLED
