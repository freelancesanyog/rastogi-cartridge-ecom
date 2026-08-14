import django_filters
from django.db.models import Q

from apps.compatibility.models import DeviceBrand, DeviceModel


class DeviceBrandFilter(django_filters.FilterSet):
    """
    FilterSet for DeviceBrand model.
    """

    category = django_filters.CharFilter(method="filter_category")

    class Meta:
        model = DeviceBrand
        fields = ["category"]

    def filter_category(self, queryset, name, value):
        if value.isdigit():
            return queryset.filter(device_models__category_id=value).distinct()
        return queryset.filter(device_models__category__slug=value).distinct()


class DeviceModelFilter(django_filters.FilterSet):
    """
    FilterSet for DeviceModel endpoints.
    """

    brand = django_filters.CharFilter(method="filter_brand")
    category = django_filters.CharFilter(method="filter_category")

    class Meta:
        model = DeviceModel
        fields = ["brand", "category"]

    def filter_brand(self, queryset, name, value):
        if value.isdigit():
            return queryset.filter(brand_id=value)
        return queryset.filter(brand__slug=value)

    def filter_category(self, queryset, name, value):
        if value.isdigit():
            return queryset.filter(Q(category_id=value) | Q(category__parent_id=value))
        return queryset.filter(Q(category__slug=value) | Q(category__parent__slug=value))
