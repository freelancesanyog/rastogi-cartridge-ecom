import django_filters
from django.db.models import Q

from apps.catalog.models import CartridgeType, Product


class ProductFilter(django_filters.FilterSet):
    """
    FilterSet for Product list endpoints using django-filter.
    """

    brand = django_filters.CharFilter(field_name="brand__slug", lookup_expr="exact")
    category = django_filters.CharFilter(method="filter_category")
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr="lte")
    cartridge_type = django_filters.ChoiceFilter(choices=CartridgeType.choices)
    in_stock = django_filters.BooleanFilter(method="filter_in_stock")

    class Meta:
        model = Product
        fields = ["brand", "category", "min_price", "max_price", "cartridge_type", "in_stock"]

    def filter_category(self, queryset, name, value):
        """
        Filters products by category slug or ID, including child categories.
        """
        if value.isdigit():
            return queryset.filter(Q(category_id=value) | Q(category__parent_id=value))
        return queryset.filter(Q(category__slug=value) | Q(category__parent__slug=value))

    def filter_in_stock(self, queryset, name, value):
        """
        Filters products that have variants with stock > 0.
        """
        if value:
            return queryset.filter(variants__stock__gt=0).distinct()
        return queryset
