from decimal import Decimal

import pytest

from apps.catalog.models import Category, Product
from apps.compatibility.models import CompatibilityMapping, DeviceBrand, DeviceModel
from apps.compatibility.services import CompatibilityService


@pytest.mark.django_db
def test_forward_and_reverse_compatibility_lookups():
    """
    Test forward lookup (device -> products) and reverse lookup (product -> devices).
    """
    # Create category requiring compatibility
    cartridge_cat = Category.objects.create(
        name="Printer Cartridges", requires_compatibility_mapping=True
    )

    hp_device_brand = DeviceBrand.objects.create(name="HP")
    hp_printer = DeviceModel.objects.create(
        brand=hp_device_brand,
        category=cartridge_cat,
        model_name="LaserJet Pro",
        model_number="M404dn",
    )

    product1 = Product.objects.create(
        sku="HP-CF258A",
        name="HP 58A Black Toner",
        category=cartridge_cat,
        price=Decimal("110.00"),
        mrp=Decimal("130.00"),
        is_active=True,
    )
    product2 = Product.objects.create(
        sku="HP-CF258X",
        name="HP 58X High Yield Toner",
        category=cartridge_cat,
        price=Decimal("190.00"),
        mrp=Decimal("220.00"),
        is_active=True,
    )

    # Link compatibility
    CompatibilityMapping.objects.create(device_model=hp_printer, product=product1)
    CompatibilityMapping.objects.create(device_model=hp_printer, product=product2)

    # 1. Forward lookup: get_compatible_products
    comp_products = CompatibilityService.get_compatible_products(hp_printer)
    assert comp_products.count() == 2
    assert set(comp_products) == {product1, product2}

    # 2. Reverse lookup: get_compatible_device_models
    comp_devices = CompatibilityService.get_compatible_device_models(product1)
    assert comp_devices.count() == 1
    assert comp_devices.first() == hp_printer


@pytest.mark.django_db
def test_standalone_category_compatibility_isolation():
    """
    Negative test case: Product in a standalone category (requires_compatibility_mapping=False)
    returns category_requires_compatibility=False and an empty queryset for reverse lookup.
    """
    mouse_cat = Category.objects.create(
        name="Computer Mice", requires_compatibility_mapping=False
    )
    mouse_product = Product.objects.create(
        sku="LOGI-MX1",
        name="Logitech MX Master 3S Mouse",
        category=mouse_cat,
        price=Decimal("99.99"),
        mrp=Decimal("99.99"),
        is_active=True,
    )

    # Verify category check
    assert CompatibilityService.category_requires_compatibility(mouse_cat) is False

    # Reverse lookup should return empty queryset
    comp_devices = CompatibilityService.get_compatible_device_models(mouse_product)
    assert comp_devices.count() == 0
