import logging

from django.core.cache import cache
from django.db.models import Prefetch

from apps.catalog.models import Category, Product, ProductVariant

logger = logging.getLogger(__name__)

CATALOG_CACHE_PREFIX = "catalog_cache_"
CATEGORY_TREE_CACHE_KEY = "catalog_category_tree"


class CatalogService:
    """
    Domain service layer for catalog business logic.
    Encapsulates database operations, queries, price calculations, and cache invalidation.
    """

    @staticmethod
    def get_active_products():
        """
        Returns queryset of active products optimized with prefetch_related and select_related.
        """
        return (
            Product.objects.filter(is_active=True)
            .select_related("brand", "category")
            .prefetch_related(
                Prefetch("images"),
                Prefetch("variants"),
            )
        )

    @staticmethod
    def get_product_by_slug(slug: str):
        """
        Fetches an active product by its unique slug.
        """
        try:
            return CatalogService.get_active_products().get(slug=slug)
        except Product.DoesNotExist:
            return None

    @staticmethod
    def get_category_tree():
        """
        Returns top-level categories with prefetched children for tree views.
        Uses Redis cache for fast responses under load.
        """
        cached_tree = cache.get(CATEGORY_TREE_CACHE_KEY)
        if cached_tree is not None:
            return cached_tree

        categories = (
            Category.objects.filter(parent__isnull=True)
            .prefetch_related("children")
            .order_by("name")
        )

        cache.set(CATEGORY_TREE_CACHE_KEY, categories, timeout=3600)  # 1 hour cache
        return categories

    @staticmethod
    def calculate_effective_price(product: Product, variant: ProductVariant = None):
        """
        Calculates the effective selling price for a product or specific variant.
        """
        if variant and variant.price_override is not None:
            return variant.price_override
        return product.price

    @staticmethod
    def calculate_discount_percentage(product: Product, variant: ProductVariant = None):
        """
        Calculates discount percentage compared to MRP.
        """
        price = CatalogService.calculate_effective_price(product, variant)
        if product.mrp and product.mrp > price:
            discount = ((product.mrp - price) / product.mrp) * 100
            return round(discount, 2)
        return 0.0

    @staticmethod
    def clear_catalog_cache():
        """
        Clears all catalog-related cached data from Redis.
        """
        try:
            cache.delete(CATEGORY_TREE_CACHE_KEY)
            # Clear all cached list responses
            if hasattr(cache, "delete_pattern"):
                cache.delete_pattern(f"{CATALOG_CACHE_PREFIX}*")
            else:
                cache.clear()
            logger.info("Catalog cache successfully invalidated.")
        except Exception as exc:
            logger.error("Failed to clear catalog cache: %s", exc)
