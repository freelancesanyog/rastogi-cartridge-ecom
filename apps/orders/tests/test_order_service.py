from concurrent.futures import ThreadPoolExecutor
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from django.db import OperationalError, connection, transaction

from apps.cart.models import Cart
from apps.cart.services import CartService
from apps.catalog.models import Category, Product
from apps.inventory.exceptions import InsufficientStockError
from apps.inventory.models import StockRecord
from apps.orders.models import OrderStatus
from apps.orders.services import OrderService
from apps.payments.gateways.base import BasePaymentGateway
from apps.payments.gateways.factory import PaymentGatewayFactory
from apps.payments.models import PaymentTransaction, TransactionStatus

User = get_user_model()


@pytest.fixture
def test_setup():
    user = User.objects.create_user(email="orderuser@example.com", password="Password123!")
    cat = Category.objects.create(name="Monitors")
    product = Product.objects.create(
        sku="MON-4K-PRO",
        name="UltraWide Monitor",
        category=cat,
        price=Decimal("400.00"),
        mrp=Decimal("450.00"),
        is_active=True,
    )
    stock_record = StockRecord.objects.create(
        product=product, quantity=5, reserved_quantity=0, low_stock_threshold=2
    )

    address_data = {
        "street_address": "123 Main St",
        "city": "Metropolis",
        "state": "NY",
        "postal_code": "10001",
        "country": "United States",
    }

    return {
        "user": user,
        "product": product,
        "stock_record": stock_record,
        "address_data": address_data,
    }


@pytest.mark.django_db
def test_full_cod_checkout_flow(test_setup):
    """
    Test complete COD checkout flow: cart -> order created -> stock deducted -> order confirmed.
    """
    user = test_setup["user"]
    product = test_setup["product"]
    stock_record = test_setup["stock_record"]
    address_data = test_setup["address_data"]

    # 1. Create cart with 2 items
    cart = Cart.objects.create(user=user, is_active=True)
    CartService.add_item(cart, product, 2)

    # 2. Perform COD Checkout
    order = OrderService.create_order_from_cart(user, cart, address_data, payment_method="cod")

    # Assert order status & totals
    assert order.status == OrderStatus.CONFIRMED
    assert order.payment_status == TransactionStatus.PENDING
    assert order.total_amount == Decimal("800.00")
    assert order.items.count() == 1

    # Assert stock immediately deducted from 5 -> 3
    stock_record.refresh_from_db()
    assert stock_record.quantity == 3

    # Assert PaymentTransaction created
    assert order.transactions.count() == 1
    assert order.transactions.first().payment_method == "cod"

    # Assert cart deactivated
    cart.refresh_from_db()
    assert cart.is_active is False


@pytest.mark.django_db(transaction=True)
def test_concurrent_cod_checkout_race_condition():
    """
    Simulates two simultaneous COD order checkouts for the last item in stock.
    Verifies concurrency protection ensures only 1 checkout succeeds and stock drops to 0.
    """
    user1 = User.objects.create_user(email="buyer1@example.com", password="Password123!")
    user2 = User.objects.create_user(email="buyer2@example.com", password="Password123!")
    cat = Category.objects.create(name="GPUs")
    product = Product.objects.create(
        sku="GPU-4090",
        name="RTX 4090",
        category=cat,
        price=Decimal("1500.00"),
        mrp=Decimal("1600.00"),
        is_active=True,
    )
    stock_record = StockRecord.objects.create(
        product=product, quantity=1, reserved_quantity=0, low_stock_threshold=1
    )

    cart1 = Cart.objects.create(user=user1, is_active=True)
    CartService.add_item(cart1, product, 1)

    cart2 = Cart.objects.create(user=user2, is_active=True)
    CartService.add_item(cart2, product, 1)

    addr = {"street_address": "123 Main St", "city": "City", "state": "ST", "postal_code": "00000"}

    results = []
    errors = []

    def attempt_checkout(u, c):
        connection.close()
        try:
            with transaction.atomic():
                ord_obj = OrderService.create_order_from_cart(u, c, addr, payment_method="cod")
                results.append(ord_obj)
        except (InsufficientStockError, OperationalError) as exc:
            errors.append(exc)
        finally:
            connection.close()

    with ThreadPoolExecutor(max_workers=2) as executor:
        f1 = executor.submit(attempt_checkout, user1, cart1)
        f2 = executor.submit(attempt_checkout, user2, cart2)
        f1.result()
        f2.result()

    assert len(results) == 1
    assert len(errors) == 1
    stock_record.refresh_from_db()
    assert stock_record.quantity == 0


@pytest.mark.django_db
def test_order_cancellation_restores_stock(test_setup):
    """
    Test that cancelling an unshipped order restores physical stock back into inventory.
    """
    user = test_setup["user"]
    product = test_setup["product"]
    stock_record = test_setup["stock_record"]
    address_data = test_setup["address_data"]

    cart = Cart.objects.create(user=user, is_active=True)
    CartService.add_item(cart, product, 2)
    order = OrderService.create_order_from_cart(user, cart, address_data, payment_method="cod")

    # Stock is now 3
    stock_record.refresh_from_db()
    assert stock_record.quantity == 3

    # Cancel Order
    cancelled_order = OrderService.cancel_order(order, reason="Customer request", user=user)
    assert cancelled_order.status == OrderStatus.CANCELLED

    # Stock restored back to 5
    stock_record.refresh_from_db()
    assert stock_record.quantity == 5


class MockRazorpayGateway(BasePaymentGateway):
    """
    Dummy gateway implementation testing PaymentGatewayFactory swappability.
    """

    def process_payment(self, order):
        return PaymentTransaction.objects.create(
            order=order,
            transaction_id="RZP-TEST-12345",
            payment_method="razorpay",
            status=TransactionStatus.PENDING,
            amount=order.total_amount,
        )

    def verify_payment(self, order, payload: dict):
        return True


@pytest.mark.django_db
def test_swappable_payment_gateway_abstraction(test_setup):
    """
    Verifies PaymentGateway abstraction can be swapped dynamically without changing core order creation code.
    """
    PaymentGatewayFactory.register_gateway("razorpay", MockRazorpayGateway)

    user = test_setup["user"]
    product = test_setup["product"]
    address_data = test_setup["address_data"]

    cart = Cart.objects.create(user=user, is_active=True)
    CartService.add_item(cart, product, 1)

    order = OrderService.create_order_from_cart(user, cart, address_data, payment_method="razorpay")
    assert order.payment_method == "razorpay"
    assert order.transactions.first().transaction_id == "RZP-TEST-12345"
