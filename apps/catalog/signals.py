from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.catalog.models import Brand, Category, Product, ProductImage, ProductVariant
from apps.catalog.services import CatalogService


@receiver([post_save, post_delete], sender=Product)
@receiver([post_save, post_delete], sender=Category)
@receiver([post_save, post_delete], sender=Brand)
@receiver([post_save, post_delete], sender=ProductImage)
@receiver([post_save, post_delete], sender=ProductVariant)
def invalidate_catalog_cache_signal(sender, instance, **kwargs):
    """
    Signal handler triggering cache invalidation whenever catalog entities are modified.
    """
    CatalogService.clear_catalog_cache()
