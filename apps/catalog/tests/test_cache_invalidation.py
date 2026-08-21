from decimal import Decimal

import pytest

from apps.catalog.models import Category, Product
from apps.core.cache import delete_cache_pattern, safe_cache_get, safe_cache_set


@pytest.mark.django_db
class TestGranularCacheInvalidation:
    def test_delete_cache_pattern_removes_only_matching_keys(self):
        safe_cache_set("catalog_cache_detail_prod-1", {"id": 1})
        safe_cache_set("catalog_cache_list_/api/v1/products/", {"count": 1})
        safe_cache_set("unrelated_session_key", "session_data")

        delete_cache_pattern("catalog_cache_*")

        assert safe_cache_get("catalog_cache_detail_prod-1") is None
        assert safe_cache_get("catalog_cache_list_/api/v1/products/") is None
        assert safe_cache_get("unrelated_session_key") == "session_data"

    def test_product_update_invalidates_specific_detail_and_list_cache(self):
        category = Category.objects.create(name="Printers", slug="printers")
        product_1 = Product.objects.create(
            name="Laser Printer 100",
            slug="laser-printer-100",
            sku="SKU-100",
            price=Decimal("15000.00"),
            mrp=Decimal("18000.00"),
            category=category,
        )
        product_2 = Product.objects.create(
            name="Inkjet Printer 200",
            slug="inkjet-printer-200",
            sku="SKU-200",
            price=Decimal("8000.00"),
            mrp=Decimal("10000.00"),
            category=category,
        )

        safe_cache_set(f"catalog_cache_detail_{product_1.slug}", {"name": product_1.name})
        safe_cache_set(f"catalog_cache_detail_{product_2.slug}", {"name": product_2.name})
        safe_cache_set("catalog_cache_list_/api/v1/products/", {"results": [1, 2]})
        safe_cache_set("user_session_abc", "active")

        # Update product 1
        product_1.name = "Laser Printer 100 Pro"
        product_1.save()

        # Product 1 detail cache and product list cache should be invalidated
        assert safe_cache_get(f"catalog_cache_detail_{product_1.slug}") is None
        assert safe_cache_get("catalog_cache_list_/api/v1/products/") is None

        # Product 2 detail cache and unrelated session should remain untouched
        assert safe_cache_get(f"catalog_cache_detail_{product_2.slug}") == {"name": product_2.name}
        assert safe_cache_get("user_session_abc") == "active"

    def test_category_update_invalidates_category_tree_and_list_cache(self):
        category = Category.objects.create(name="Toner Cartridges", slug="toner-cartridges")
        safe_cache_set("catalog_category_tree", [{"id": category.id}])
        safe_cache_set("catalog_cache_list_/api/v1/products/", {"results": []})
        safe_cache_set("keep_this_key", "alive")

        category.name = "Toner Cartridges & Ribbons"
        category.save()

        assert safe_cache_get("catalog_category_tree") is None
        assert safe_cache_get("catalog_cache_list_/api/v1/products/") is None
        assert safe_cache_get("keep_this_key") == "alive"
