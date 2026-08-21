import logging

from django.db.models import Prefetch

from apps.catalog.models import Category, Product, ProductVariant
from apps.core.cache import delete_cache_keys, delete_cache_pattern, safe_cache_get, safe_cache_set

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
        cached_tree = safe_cache_get(CATEGORY_TREE_CACHE_KEY)
        if cached_tree is not None:
            return cached_tree

        categories = list(
            Category.objects.filter(parent__isnull=True)
            .prefetch_related("children")
            .order_by("name")
        )

        safe_cache_set(CATEGORY_TREE_CACHE_KEY, categories, timeout=3600)  # 1 hour cache
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
    def invalidate_product_cache(slug: str = None):
        """
        Invalidates specific product detail cache key (if slug provided)
        and all paginated/filtered list caches under catalog_cache_list_*.
        """
        try:
            if slug:
                delete_cache_keys(f"{CATALOG_CACHE_PREFIX}detail_{slug}")
            delete_cache_pattern(f"{CATALOG_CACHE_PREFIX}list_*")
            logger.info("Product cache invalidated for slug: %s", slug or "all")
        except Exception as exc:
            logger.error("Failed to invalidate product cache: %s", exc)

    @staticmethod
    def invalidate_category_cache():
        """
        Invalidates category tree cache and catalog list caches.
        """
        try:
            delete_cache_keys(CATEGORY_TREE_CACHE_KEY)
            delete_cache_pattern(f"{CATALOG_CACHE_PREFIX}list_*")
            logger.info("Category cache successfully invalidated.")
        except Exception as exc:
            logger.error("Failed to invalidate category cache: %s", exc)

    @staticmethod
    def clear_catalog_cache():
        """
        Clears all catalog-related cached entries selectively from Redis
        without touching unrelated keys (sessions, Celery, health checks).
        """
        try:
            delete_cache_keys(CATEGORY_TREE_CACHE_KEY)
            delete_cache_pattern(f"{CATALOG_CACHE_PREFIX}*")
            logger.info("Catalog cache successfully invalidated.")
        except Exception as exc:
            logger.error("Failed to clear catalog cache: %s", exc)

