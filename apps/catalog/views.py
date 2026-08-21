import logging

from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.catalog.filters import ProductFilter
from apps.catalog.models import Brand, Category
from apps.catalog.serializers import (
    BrandSerializer,
    CategorySerializer,
    CategoryTreeSerializer,
    ProductDetailSerializer,
    ProductListSerializer,
)
from apps.catalog.services import CATALOG_CACHE_PREFIX, CatalogService
from apps.catalog.throttles import StockPollingThrottle
from apps.core.cache import safe_cache_get, safe_cache_set
from apps.inventory.services import InventoryService

logger = logging.getLogger(__name__)


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ReadOnly ViewSet for Product discovery, filtering, search, and detail views.
    Integrates Redis response caching.
    """

    lookup_field = "slug"
    permission_classes = [AllowAny]
    throttle_classes = []
    filterset_class = ProductFilter
    search_fields = ["name", "sku", "description", "brand__name"]
    ordering_fields = ["price", "created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return CatalogService.get_active_products()

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ProductDetailSerializer
        return ProductListSerializer

    def list(self, request, *args, **kwargs):
        # Build cache key based on query parameters
        cache_key = f"{CATALOG_CACHE_PREFIX}list_{request.get_full_path()}"
        cached_response = safe_cache_get(cache_key)

        if cached_response is not None:
            return Response(cached_response)

        response = super().list(request, *args, **kwargs)
        if response.status_code == 200:
            safe_cache_set(cache_key, response.data, timeout=1800)  # 30 mins cache
        return response

    def retrieve(self, request, *args, **kwargs):
        slug = kwargs.get("slug")
        cache_key = f"{CATALOG_CACHE_PREFIX}detail_{slug}"
        cached_response = safe_cache_get(cache_key)

        if cached_response is not None:
            return Response(cached_response)

        response = super().retrieve(request, *args, **kwargs)
        if response.status_code == 200:
            safe_cache_set(cache_key, response.data, timeout=3600)  # 1 hour cache
        return response

    @method_decorator(never_cache)
    @action(
        detail=True,
        methods=["get"],
        url_path="stock",
        throttle_classes=[StockPollingThrottle],
    )
    def stock(self, request, slug=None):
        """
        Uncached live stock API returning real-time inventory levels
        calculated strictly from StockRecord objects.
        Uses StockPollingThrottle scope to allow 4-second HTTP polling.
        """
        product = self.get_object()
        stock_data = InventoryService.get_bulk_stock_status(product)
        response = Response(stock_data)
        response["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
        response["Pragma"] = "no-cache"
        response["Expires"] = "0"
        return response


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ReadOnly ViewSet for Product Categories and Category Tree API.
    """

    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = "slug"
    permission_classes = [AllowAny]
    throttle_classes = []

    @action(detail=False, methods=["get"], url_path="tree")
    def tree(self, request):
        """
        Returns full nested category tree structure.
        """
        categories = CatalogService.get_category_tree()
        serializer = CategoryTreeSerializer(categories, many=True)
        return Response(serializer.data)


class BrandViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ReadOnly ViewSet for Product Brands.
    """

    queryset = Brand.objects.all()
    serializer_class = BrandSerializer
    lookup_field = "slug"
    permission_classes = [AllowAny]
    throttle_classes = []
