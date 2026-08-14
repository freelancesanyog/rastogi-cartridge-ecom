import logging

from django.db.models import Prefetch

from apps.catalog.models import Category, Product
from apps.compatibility.models import DeviceModel

logger = logging.getLogger(__name__)

COMPATIBILITY_CACHE_PREFIX = "compatibility_cache_"


class CompatibilityService:
    """
    Service layer handling host device compatibility lookups and category checks.
    """

    @staticmethod
    def category_requires_compatibility(category: Category) -> bool:
        """
        Returns True if the given category requires host device compatibility mapping.
        """
        if not category:
            return False
        return getattr(category, "requires_compatibility_mapping", False)

    @staticmethod
    def get_compatible_products(device_model_identifier):
        """
        Returns active products compatible with the specified DeviceModel (by ID, slug, or instance).
        """
        if isinstance(device_model_identifier, DeviceModel):
            device_model = device_model_identifier
        elif isinstance(device_model_identifier, int):
            device_model = DeviceModel.objects.filter(pk=device_model_identifier).first()
        else:
            device_model = DeviceModel.objects.filter(slug=device_model_identifier).first()

        if not device_model:
            return Product.objects.none()

        return (
            Product.objects.filter(
                compatibility_mappings__device_model=device_model,
                is_active=True,
            )
            .select_related("brand", "category")
            .prefetch_related(
                Prefetch("images"),
                Prefetch("variants"),
            )
            .distinct()
        )

    @staticmethod
    def get_compatible_device_models(product_identifier):
        """
        Reverse lookup returning DeviceModel entries compatible with a Product.
        If the product's category does NOT require compatibility mapping, returns an empty queryset.
        """
        if isinstance(product_identifier, Product):
            product = product_identifier
        elif isinstance(product_identifier, int):
            product = Product.objects.select_related("category").filter(pk=product_identifier).first()
        else:
            product = Product.objects.select_related("category").filter(slug=product_identifier).first()

        if not product:
            return DeviceModel.objects.none()

        # If category does not require compatibility, return empty queryset
        if not CompatibilityService.category_requires_compatibility(product.category):
            return DeviceModel.objects.none()

        return (
            DeviceModel.objects.filter(compatibility_mappings__product=product)
            .select_related("brand", "category")
            .distinct()
        )
