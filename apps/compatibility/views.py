import logging

from django.core.cache import cache
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.catalog.models import Category
from apps.catalog.serializers import CategorySerializer, ProductListSerializer
from apps.compatibility.filters import DeviceBrandFilter, DeviceModelFilter
from apps.compatibility.models import DeviceBrand, DeviceModel
from apps.compatibility.serializers import DeviceBrandSerializer, DeviceModelSerializer
from apps.compatibility.services import COMPATIBILITY_CACHE_PREFIX, CompatibilityService

logger = logging.getLogger(__name__)


class DeviceBrandViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ReadOnly ViewSet for Device Brands.
    """

    queryset = DeviceBrand.objects.all()
    serializer_class = DeviceBrandSerializer
    lookup_field = "slug"
    permission_classes = [AllowAny]
    throttle_classes = []
    filterset_class = DeviceBrandFilter


class DeviceModelViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ReadOnly ViewSet for Device Models & "Find compatible products" lookup.
    """

    queryset = DeviceModel.objects.select_related("brand", "category").all()
    serializer_class = DeviceModelSerializer
    lookup_field = "slug"
    permission_classes = [AllowAny]
    throttle_classes = []
    filterset_class = DeviceModelFilter
    search_fields = ["model_name", "model_number", "brand__name"]
    ordering_fields = ["model_name", "model_number", "created_at"]
    ordering = ["brand__name", "model_name"]

    @action(detail=True, methods=["get"], url_path="products")
    def find_products(self, request, slug=None):
        """
        "Find compatible products" endpoint: given a device model slug,
        returns active compatible products (paginated & Redis cached).
        """
        cache_key = f"{COMPATIBILITY_CACHE_PREFIX}products_{slug}_{request.get_full_path()}"
        cached_response = cache.get(cache_key)

        if cached_response is not None:
            return Response(cached_response)

        device_model = self.get_object()
        products_qs = CompatibilityService.get_compatible_products(device_model)

        page = self.paginate_queryset(products_qs)
        if page is not None:
            serializer = ProductListSerializer(page, many=True)
            paginated_res = self.get_paginated_response(serializer.data)
            cache.set(cache_key, paginated_res.data, timeout=1800)  # 30 mins cache
            return paginated_res

        serializer = ProductListSerializer(products_qs, many=True)
        cache.set(cache_key, serializer.data, timeout=1800)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="compatibility-categories")
    def compatibility_categories(self, request):
        """
        Endpoint exposing categories that require host device compatibility lookup,
        allowing frontend applications to conditionally render compatibility search flows.
        """
        categories = Category.objects.filter(requires_compatibility_mapping=True)
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)
