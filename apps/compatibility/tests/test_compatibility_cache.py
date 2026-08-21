from decimal import Decimal
import pytest

from apps.catalog.models import Category, Product
from apps.compatibility.models import CompatibilityMapping, DeviceBrand, DeviceModel
from apps.core.cache import safe_cache_get, safe_cache_set


@pytest.mark.django_db
class TestCompatibilityCacheInvalidation:
    def test_compatibility_mapping_update_invalidates_only_target_model_cache(self):
        category = Category.objects.create(name="Toner", slug="toner")
        brand = DeviceBrand.objects.create(name="HP", slug="hp")
        model_1 = DeviceModel.objects.create(
            brand=brand, category=category, model_name="LaserJet 100", slug="laserjet-100"
        )
        model_2 = DeviceModel.objects.create(
            brand=brand, category=category, model_name="LaserJet 200", slug="laserjet-200"
        )
        product = Product.objects.create(
            name="HP 12A Cartridge",
            slug="hp-12a",
            sku="12A",
            price=Decimal("1200.00"),
            mrp=Decimal("1500.00"),
            category=category,
        )

        safe_cache_set(f"compatibility_cache_products_{model_1.slug}_/api/v1/models/laserjet-100/products/", {"count": 1})
        safe_cache_set(f"compatibility_cache_products_{model_2.slug}_/api/v1/models/laserjet-200/products/", {"count": 1})
        safe_cache_set("unrelated_cache_key", "valid")

        # Create mapping for model_1
        mapping = CompatibilityMapping.objects.create(device_model=model_1, product=product)

        # Model 1 compatibility cache should be invalidated
        assert safe_cache_get(f"compatibility_cache_products_{model_1.slug}_/api/v1/models/laserjet-100/products/") is None

        # Model 2 compatibility cache and unrelated cache key should remain
        assert safe_cache_get(f"compatibility_cache_products_{model_2.slug}_/api/v1/models/laserjet-200/products/") == {"count": 1}
        assert safe_cache_get("unrelated_cache_key") == "valid"
