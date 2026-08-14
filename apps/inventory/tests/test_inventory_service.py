from concurrent.futures import ThreadPoolExecutor
from decimal import Decimal

import pytest
from django.db import OperationalError, connection, transaction

from apps.catalog.models import Category, Product
from apps.inventory.exceptions import InsufficientStockError
from apps.inventory.models import StockRecord
from apps.inventory.services import InventoryService


@pytest.mark.django_db(transaction=True)
def test_reserve_release_and_deduct_stock():
    """
    Test standard reserve, release, and deduct stock logic.
    """
    cat = Category.objects.create(name="Keyboards")
    product = Product.objects.create(
        sku="KEY-001",
        name="Mechanical Keyboard",
        category=cat,
        price=Decimal("89.99"),
        mrp=Decimal("99.99"),
    )
    record = StockRecord.objects.create(
        product=product,
        quantity=10,
        reserved_quantity=0,
        low_stock_threshold=3,
    )

    # 1. Reserve 3 items
    r1 = InventoryService.reserve_stock(record.id, 3)
    assert r1.reserved_quantity == 3
    assert r1.available_quantity == 7

    # 2. Release 1 item
    r2 = InventoryService.release_stock(record.id, 1)
    assert r2.reserved_quantity == 2
    assert r2.available_quantity == 8

    # 3. Deduct 2 items
    r3 = InventoryService.deduct_stock(record.id, 2, from_reserved=True)
    assert r3.quantity == 8
    assert r3.reserved_quantity == 0
    assert r3.available_quantity == 8


@pytest.mark.django_db(transaction=True)
def test_concurrent_stock_deduction():
    """
    Simulates two simultaneous purchases of the last item in stock.
    Verifies that concurrency protection prevents overselling — exactly one purchase succeeds
    and the second purchase is safely rejected with InsufficientStockError or OperationalError (row/table lock),
    leaving remaining stock at zero.
    """
    cat = Category.objects.create(name="Monitors")
    product = Product.objects.create(
        sku="MON-4K",
        name="4K Gaming Monitor",
        category=cat,
        price=Decimal("499.99"),
        mrp=Decimal("549.99"),
    )
    record = StockRecord.objects.create(
        product=product,
        quantity=1,
        reserved_quantity=0,
        low_stock_threshold=1,
    )

    results = []
    errors = []

    def attempt_deduction():
        connection.close()
        try:
            with transaction.atomic():
                res = InventoryService.deduct_stock(record.id, 1, from_reserved=False)
                results.append(res)
        except (InsufficientStockError, OperationalError) as exc:
            errors.append(exc)
        finally:
            connection.close()

    with ThreadPoolExecutor(max_workers=2) as executor:
        f1 = executor.submit(attempt_deduction)
        f2 = executor.submit(attempt_deduction)
        f1.result()
        f2.result()

    # Assert exactly 1 purchase succeeded and 1 failed with lock or stock error
    assert len(results) == 1
    assert len(errors) == 1
    assert isinstance(errors[0], (InsufficientStockError, OperationalError))

    # Assert final stock quantity is zero
    record.refresh_from_db()
    assert record.quantity == 0
    assert record.available_quantity == 0
