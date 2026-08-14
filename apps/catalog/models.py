from django.db import models, transaction
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _

from apps.core.models import TimeStampedModel


def _generate_unique_slug(model_instance, source_field="name"):
    """
    Utility function to generate unique slug if not explicitly provided or if changed.
    """
    raw_val = getattr(model_instance, source_field, "")
    base_slug = slugify(raw_val) or "item"
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


class Brand(TimeStampedModel):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    logo = models.ImageField(upload_to="brands/", blank=True, null=True)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name = _("brand")
        verbose_name_plural = _("brands")
        ordering = ["name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = _generate_unique_slug(self, source_field="name")
        super().save(*args, **kwargs)


class Category(TimeStampedModel):
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    parent = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="children",
    )
    meta_title = models.CharField(max_length=150, blank=True)
    meta_description = models.CharField(max_length=255, blank=True)
    requires_compatibility_mapping = models.BooleanField(
        default=False,
        help_text=_("Set to true for categories requiring host device compatibility lookup (e.g. Cartridges, Batteries)."),
    )

    class Meta:
        verbose_name = _("category")
        verbose_name_plural = _("categories")
        ordering = ["name"]

    def __str__(self):
        if self.parent:
            return f"{self.parent.name} -> {self.name}"
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = _generate_unique_slug(self, source_field="name")
        super().save(*args, **kwargs)


class CartridgeType(models.TextChoices):
    ORIGINAL = "original", _("Original / OEM")
    COMPATIBLE = "compatible", _("Compatible Third-Party")
    REFILLED = "refilled", _("Refilled / Remanufactured")
    NONE = "none", _("Not Applicable / Printer")


class Product(TimeStampedModel):
    sku = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=280, unique=True, blank=True)
    brand = models.ForeignKey(
        Brand, on_delete=models.PROTECT, related_name="products", null=True, blank=True
    )
    category = models.ForeignKey(
        Category, on_delete=models.PROTECT, related_name="products"
    )
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    mrp = models.DecimalField(max_digits=10, decimal_places=2, help_text=_("Maximum Retail Price"))
    specifications = models.JSONField(default=dict, blank=True)

    meta_title = models.CharField(max_length=150, blank=True)
    meta_description = models.CharField(max_length=255, blank=True)

    is_active = models.BooleanField(default=True)
    cartridge_type = models.CharField(
        max_length=20,
        choices=CartridgeType.choices,
        default=CartridgeType.NONE,
    )

    class Meta:
        verbose_name = _("product")
        verbose_name_plural = _("products")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.sku})"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = _generate_unique_slug(self, source_field="name")
        super().save(*args, **kwargs)


class ProductImage(TimeStampedModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="products/")
    alt_text = models.CharField(max_length=150, blank=True)
    is_primary = models.BooleanField(default=False)

    class Meta:
        verbose_name = _("product image")
        verbose_name_plural = _("product images")
        ordering = ["-is_primary", "id"]

    def __str__(self):
        return f"Image for {self.product.sku}"

    def save(self, *args, **kwargs):
        with transaction.atomic():
            if self.is_primary:
                ProductImage.objects.filter(product=self.product, is_primary=True).exclude(
                    pk=self.pk
                ).update(is_primary=False)
            elif not ProductImage.objects.filter(product=self.product).exclude(pk=self.pk).exists():
                self.is_primary = True
            super().save(*args, **kwargs)


class ProductVariant(TimeStampedModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="variants")
    sku = models.CharField(max_length=60, unique=True)
    attributes = models.JSONField(
        default=dict,
        blank=True,
        help_text=_("Key-value attributes e.g. {'color': 'Black', 'page_yield': '2000'}"),
    )
    price_override = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    stock = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = _("product variant")
        verbose_name_plural = _("product variants")
        ordering = ["sku"]

    def __str__(self):
        return f"Variant {self.sku} of {self.product.name}"

    @property
    def effective_price(self):
        return self.price_override if self.price_override is not None else self.product.price
