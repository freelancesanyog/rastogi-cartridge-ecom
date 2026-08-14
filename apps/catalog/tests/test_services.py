from decimal import Decimal

import pytest

from apps.catalog.models import Brand, Category, Product, ProductVariant
from apps.catalog.services import CatalogService


@pytest.mark.django_db
def test_slug_auto_generation():
    """
    Test automatic unique slug generation on save.
    """
    brand = Brand.objects.create(name="HP")
    assert brand.slug == "hp"

    category = Category.objects.create(name="Toner Cartridges")

    p1 = Product.objects.create(
        sku="SKU-1",
        name="Black Toner Cartridge",
        brand=brand,
        category=category,
        price=Decimal("50.00"),
        mrp=Decimal("60.00"),
    )
    assert p1.slug == "black-toner-cartridge"

    p2 = Product.objects.create(
        sku="SKU-2",
        name="Black Toner Cartridge",
        brand=brand,
        category=category,
        price=Decimal("50.00"),
        mrp=Decimal("60.00"),
    )
    assert p2.slug == "black-toner-cartridge-1"


@pytest.mark.django_db
def test_price_and_discount_calculation():
    """
    Test price calculation and discount percentage logic in CatalogService.
    """
    category = Category.objects.create(name="Cartridges")
    product = Product.objects.create(
        sku="HP-123A",
        name="HP 123A Black Cartridge",
        category=category,
        price=Decimal("80.00"),
        mrp=Decimal("100.00"),
    )

    discount = CatalogService.calculate_discount_percentage(product)
    assert discount == 20.0  # 20% off

    variant = ProductVariant.objects.create(
        product=product,
        sku="HP-123A-HIGH",
        price_override=Decimal("70.00"),
        stock=50,
    )
    effective_price = CatalogService.calculate_effective_price(product, variant)
    assert effective_price == Decimal("70.00")
