from decimal import Decimal

import pytest
from django.core.cache import cache
from django.urls import reverse
from rest_framework import status

from apps.catalog.models import Brand, CartridgeType, Category, Product, ProductVariant


@pytest.fixture(autouse=True)
def clear_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.mark.django_db
def test_product_list_filtering(client):
    """
    Test product list endpoint with django-filter parameters (brand, price range, cartridge_type, in_stock).
    """
    brand_hp = Brand.objects.create(name="HP")
    brand_canon = Brand.objects.create(name="Canon")

    cat_toner = Category.objects.create(name="Toner Cartridges")

    p1 = Product.objects.create(
        sku="HP-001",
        name="HP LaserJet Black Toner",
        brand=brand_hp,
        category=cat_toner,
        price=Decimal("50.00"),
        mrp=Decimal("60.00"),
        cartridge_type=CartridgeType.ORIGINAL,
        is_active=True,
    )
    v1 = ProductVariant.objects.create(product=p1, sku="HP-001-V1", stock=10)
    from apps.inventory.models import StockRecord

    StockRecord.objects.create(product=p1, variant=v1, quantity=10, reserved_quantity=0)

    p2 = Product.objects.create(
        sku="CN-002",
        name="Canon Compatible Color Cartridge",
        brand=brand_canon,
        category=cat_toner,
        price=Decimal("150.00"),
        mrp=Decimal("180.00"),
        cartridge_type=CartridgeType.COMPATIBLE,
        is_active=True,
    )
    v2 = ProductVariant.objects.create(product=p2, sku="CN-002-V1", stock=0)
    StockRecord.objects.create(product=p2, variant=v2, quantity=0, reserved_quantity=0)

    url = reverse("catalog:product-list")

    # 1. Filter by brand
    res_brand = client.get(f"{url}?brand=hp")
    assert res_brand.status_code == status.HTTP_200_OK
    assert res_brand.data["count"] == 1
    assert res_brand.data["results"][0]["sku"] == "HP-001"

    # 2. Filter by price range
    res_price = client.get(f"{url}?min_price=100&max_price=200")
    assert res_price.status_code == status.HTTP_200_OK
    assert res_price.data["count"] == 1
    assert res_price.data["results"][0]["sku"] == "CN-002"

    # 3. Filter by cartridge type
    res_type = client.get(f"{url}?cartridge_type=compatible")
    assert res_type.status_code == status.HTTP_200_OK
    assert res_type.data["count"] == 1
    assert res_type.data["results"][0]["sku"] == "CN-002"

    # 4. Filter by in_stock=true
    res_stock = client.get(f"{url}?in_stock=true")
    assert res_stock.status_code == status.HTTP_200_OK
    assert res_stock.data["count"] == 1
    assert res_stock.data["results"][0]["sku"] == "HP-001"


@pytest.mark.django_db
def test_product_detail_retrieval(client):
    """
    Test retrieving a product detail by its slug.
    """
    cat = Category.objects.create(name="Printers")
    product = Product.objects.create(
        sku="PR-100",
        name="LaserJet Pro Printer",
        category=cat,
        price=Decimal("299.99"),
        mrp=Decimal("349.99"),
        is_active=True,
    )

    url = reverse("catalog:product-detail", kwargs={"slug": product.slug})
    response = client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["sku"] == "PR-100"
    assert response.data["name"] == "LaserJet Pro Printer"


@pytest.mark.django_db
def test_cache_invalidation_on_update(client):
    """
    Test that updating a product invalidates cached API responses.
    """
    cat = Category.objects.create(name="Accessories")
    product = Product.objects.create(
        sku="ACC-1",
        name="Printer Cable 2M",
        category=cat,
        price=Decimal("15.00"),
        mrp=Decimal("20.00"),
        is_active=True,
    )

    url = reverse("catalog:product-detail", kwargs={"slug": product.slug})

    # First request primes the cache
    res1 = client.get(url)
    assert res1.status_code == status.HTTP_200_OK
    assert res1.data["name"] == "Printer Cable 2M"

    # Update product model (triggers signal)
    product.name = "Printer Cable 3M"
    product.save()

    # Second request should fetch updated data
    res2 = client.get(url)
    assert res2.status_code == status.HTTP_200_OK
    assert res2.data["name"] == "Printer Cable 3M"


@pytest.mark.django_db
def test_live_stock_api_endpoint_uncached_and_throttled(client):
    """
    Test GET /catalog/products/<slug>/stock/ endpoint returns uncached real-time stock
    from StockRecord objects and supports repeated polling under StockPollingThrottle scope.
    """
    from apps.inventory.models import StockRecord

    cat = Category.objects.create(name="Monitors")
    product = Product.objects.create(
        sku="MON-100",
        name="UltraWide Monitor",
        category=cat,
        price=Decimal("399.99"),
        mrp=Decimal("449.99"),
        is_active=True,
    )
    v1 = ProductVariant.objects.create(product=product, sku="MON-100-BLK", stock=0)
    v2 = ProductVariant.objects.create(product=product, sku="MON-100-WHT", stock=0)

    sr1 = StockRecord.objects.create(product=product, variant=v1, quantity=15, reserved_quantity=0, low_stock_threshold=5)
    sr2 = StockRecord.objects.create(product=product, variant=v2, quantity=0, reserved_quantity=0, low_stock_threshold=5)

    stock_url = reverse("catalog:product-stock", kwargs={"slug": product.slug})

    response = client.get(stock_url)
    assert response.status_code == status.HTTP_200_OK

    # Verify no-cache response headers
    assert "no-cache" in response.headers.get("Cache-Control", "")

    # Verify stock payload structure
    assert response.data["product"]["available_quantity"] == 15
    assert response.data["product"]["in_stock"] is True

    assert response.data["variants"][str(v1.id)]["available_quantity"] == 15
    assert response.data["variants"][str(v1.id)]["in_stock"] is True

    assert response.data["variants"][str(v2.id)]["available_quantity"] == 0
    assert response.data["variants"][str(v2.id)]["in_stock"] is False

    # Simulate stock update in StockRecord
    sr1.quantity = 2
    sr1.save()

    # Next call to stock endpoint must reflect new stock immediately
    response_updated = client.get(stock_url)
    assert response_updated.status_code == status.HTTP_200_OK
    assert response_updated.data["variants"][str(v1.id)]["available_quantity"] == 2
    assert response_updated.data["variants"][str(v1.id)]["low_stock"] is True

