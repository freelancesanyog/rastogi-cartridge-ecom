from decimal import Decimal

import pytest

from apps.catalog.models import Category, Product
from apps.inventory.models import StockRecord
from apps.inventory.tasks import check_low_stock_levels_task


@pytest.mark.django_db
def test_check_low_stock_levels_task():
    """
    Tests daily low-stock inspection Celery Beat task.
    """
    cat = Category.objects.create(name="Desktops")
    p1 = Product.objects.create(
        sku="CPU-01", name="Gaming PC", category=cat, price=Decimal("1200.00"), mrp=Decimal("1400.00")
    )
    p2 = Product.objects.create(
        sku="CPU-02", name="Office PC", category=cat, price=Decimal("600.00"), mrp=Decimal("700.00")
    )

    # p1 is well-stocked
    StockRecord.objects.create(product=p1, quantity=20, reserved_quantity=0, low_stock_threshold=5)
    # p2 is low-stocked
    StockRecord.objects.create(product=p2, quantity=3, reserved_quantity=0, low_stock_threshold=5)

    result = check_low_stock_levels_task()
    assert "Logged warning for 1 low-stock items." in result
