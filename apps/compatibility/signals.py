from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.compatibility.models import CompatibilityMapping, DeviceBrand, DeviceModel
from apps.compatibility.services import CompatibilityService


@receiver([post_save, post_delete], sender=CompatibilityMapping)
def invalidate_mapping_cache_signal(sender, instance, **kwargs):
    """
    Invalidates ONLY the affected device model's compatibility response cache.
    """
    model_slug = getattr(instance.device_model, "slug", None) if hasattr(instance, "device_model") else None
    CompatibilityService.invalidate_compatibility_cache(device_model_slug=model_slug)


@receiver([post_save, post_delete], sender=DeviceModel)
def invalidate_device_model_cache_signal(sender, instance, **kwargs):
    """
    Invalidates compatibility cache for the updated device model.
    """
    CompatibilityService.invalidate_compatibility_cache(device_model_slug=instance.slug)


@receiver([post_save, post_delete], sender=DeviceBrand)
def invalidate_device_brand_cache_signal(sender, instance, **kwargs):
    """
    Invalidates general compatibility caches when device brands are modified.
    """
    CompatibilityService.invalidate_compatibility_cache()
