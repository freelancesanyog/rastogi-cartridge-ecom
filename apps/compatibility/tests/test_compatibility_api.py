from decimal import Decimal

import pytest
from django.core.cache import cache
from django.urls import reverse
from rest_framework import status

from apps.catalog.models import Category, Product
from apps.compatibility.models import CompatibilityMapping, DeviceBrand, DeviceModel


@pytest.fixture(autouse=True)
def clear_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.mark.django_db
def test_device_brand_and_model_search_api(client):
    """
    Test device brand listing and device model search by model_number/model_name.
    """
    brand = DeviceBrand.objects.create(name="Canon")
    cat = Category.objects.create(name="Printers", requires_compatibility_mapping=True)

    d1 = DeviceModel.objects.create(
        brand=brand, category=cat, model_name="PIXMA", model_number="G3010"
    )
    DeviceModel.objects.create(
        brand=brand, category=cat, model_name="imageCLASS", model_number="LBP6030"
    )

    # 1. List brands
    brands_url = reverse("compatibility:brand-list")
    res_brands = client.get(brands_url)
    assert res_brands.status_code == status.HTTP_200_OK
    assert res_brands.data["count"] == 1
    assert res_brands.data["results"][0]["name"] == "Canon"

    # 2. Search devices by model number
    devices_url = reverse("compatibility:device-list")
    res_search = client.get(f"{devices_url}?search=G3010")
    assert res_search.status_code == status.HTTP_200_OK
    assert res_search.data["count"] == 1
    assert res_search.data["results"][0]["slug"] == d1.slug


@pytest.mark.django_db
def test_find_compatible_products_api(client):
    """
    Test "Find compatible products" API endpoint (/api/compatibility/devices/<slug>/products/).
    """
    brand = DeviceBrand.objects.create(name="Epson")
    cat = Category.objects.create(name="Ink Cartridges", requires_compatibility_mapping=True)
    device = DeviceModel.objects.create(
        brand=brand, category=cat, model_name="EcoTank", model_number="L3150"
    )

    product = Product.objects.create(
        sku="EP-005",
        name="Epson 003 Black Ink Bottle",
        category=cat,
        price=Decimal("12.50"),
        mrp=Decimal("15.00"),
        is_active=True,
    )
    CompatibilityMapping.objects.create(device_model=device, product=product)

    find_url = reverse("compatibility:device-find-products", kwargs={"slug": device.slug})
    response = client.get(find_url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == 1
    assert response.data["results"][0]["sku"] == "EP-005"


@pytest.mark.django_db
def test_compatibility_categories_endpoint(client):
    """
    Test endpoint listing categories where requires_compatibility_mapping=True.
    """
    Category.objects.create(name="Computer Mice", requires_compatibility_mapping=False)
    Category.objects.create(name="Laptop Batteries", requires_compatibility_mapping=True)

    url = reverse("compatibility:device-compatibility-categories")
    response = client.get(url)

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Laptop Batteries"
    assert data[0]["requires_compatibility_mapping"] is True
