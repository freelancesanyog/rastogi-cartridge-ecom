from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.catalog.models import Brand, Category, Product, ProductImage, ProductVariant
from apps.catalog.services import CatalogService
from apps.compatibility.services import CompatibilityService


@receiver([post_save, post_delete], sender=Product)
def invalidate_product_cache_signal(sender, instance, **kwargs):
    """
    Invalidates detail cache for affected product + catalog list cache + compatibility cache.
    """
    CatalogService.invalidate_product_cache(slug=instance.slug)
    CompatibilityService.invalidate_compatibility_cache()


@receiver([post_save, post_delete], sender=Category)
def invalidate_category_cache_signal(sender, instance, **kwargs):
    """
    Invalidates category tree cache and catalog list cache when categories change.
    """
    CatalogService.invalidate_category_cache()


@receiver([post_save, post_delete], sender=Brand)
def invalidate_brand_cache_signal(sender, instance, **kwargs):
    """
    Invalidates product list cache when product brands change.
    """
    CatalogService.invalidate_product_cache()


@receiver([post_save, post_delete], sender=ProductVariant)
@receiver([post_save, post_delete], sender=ProductImage)
def invalidate_product_child_cache_signal(sender, instance, **kwargs):
    """
    Invalidates parent product's detail cache & list cache when variants/images change.
    """
    parent_slug = getattr(instance.product, "slug", None) if hasattr(instance, "product") else None
    CatalogService.invalidate_product_cache(slug=parent_slug)

