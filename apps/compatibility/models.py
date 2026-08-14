from django.db import models
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _

from apps.catalog.models import Category, Product
from apps.core.models import TimeStampedModel


def _generate_unique_slug(model_instance, source_val):
    """
    Utility to auto-generate unique slug for device models and brands.
    """
    base_slug = slugify(source_val) or "device"
    slug = model_instance.slug or base_slug
    model_class = model_instance.__class__

    qs = model_class.objects.filter(slug=slug).exclude(pk=model_instance.pk)
    if not qs.exists():
        return slug

    counter = 1
    new_slug = f"{base_slug}-{counter}"
    while model_class.objects.filter(slug=new_slug).exclude(pk=model_instance.pk).exists():
        counter += 1
        new_slug = f"{base_slug}-{counter}"
    return new_slug


class DeviceBrand(TimeStampedModel):
    """
    Brand of the host device (e.g. HP, Canon, Dell, Apple).
    """

    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)

    class Meta:
        verbose_name = _("device brand")
        verbose_name_plural = _("device brands")
        ordering = ["name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = _generate_unique_slug(self, self.name)
        super().save(*args, **kwargs)


class DeviceModel(TimeStampedModel):
    """
    Host device model (e.g., LaserJet Pro M404dn, Latitude 5420 Laptop)
    belonging to a specific host brand and product category.
    """

    brand = models.ForeignKey(
        DeviceBrand, on_delete=models.CASCADE, related_name="device_models"
    )
    category = models.ForeignKey(
        Category, on_delete=models.CASCADE, related_name="device_models"
    )
    model_name = models.CharField(max_length=150)
    model_number = models.CharField(max_length=100, blank=True)
    slug = models.SlugField(max_length=200, unique=True, blank=True)

    class Meta:
        verbose_name = _("device model")
        verbose_name_plural = _("device models")
        ordering = ["brand__name", "model_name"]

    def __str__(self):
        number_str = f" ({self.model_number})" if self.model_number else ""
        return f"{self.brand.name} {self.model_name}{number_str}"

    def save(self, *args, **kwargs):
        if not self.slug:
            full_name = f"{self.brand.name} {self.model_name} {self.model_number}".strip()
            self.slug = _generate_unique_slug(self, full_name)
        super().save(*args, **kwargs)


class CompatibilityMapping(TimeStampedModel):
    """
    Cross-reference junction table linking a host DeviceModel to a sold Product.
    """

    device_model = models.ForeignKey(
        DeviceModel, on_delete=models.CASCADE, related_name="compatibility_mappings"
    )
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="compatibility_mappings"
    )
    note = models.CharField(
        max_length=255,
        blank=True,
        help_text=_("Optional note, e.g., 'High Yield Cartridge' or '65W Power Adapter'"),
    )

    class Meta:
        verbose_name = _("compatibility mapping")
        verbose_name_plural = _("compatibility mappings")
        unique_together = ("device_model", "product")
        ordering = ["device_model", "product"]

    def __str__(self):
        return f"{self.device_model} <-> {self.product.name}"
