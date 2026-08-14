from django.contrib import admin

from apps.compatibility.models import CompatibilityMapping, DeviceBrand, DeviceModel


@admin.register(DeviceBrand)
class DeviceBrandAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "created_at")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


class CompatibilityMappingInline(admin.TabularInline):
    model = CompatibilityMapping
    extra = 1
    autocomplete_fields = ["product"]


@admin.register(DeviceModel)
class DeviceModelAdmin(admin.ModelAdmin):
    """
    Admin interface for Host Device Models with category visibility & search autocomplete.
    """

    inlines = [CompatibilityMappingInline]
    list_display = ("model_name", "model_number", "brand", "category", "slug", "created_at")
    list_filter = ("brand", "category")
    search_fields = ("model_name", "model_number", "brand__name")
    autocomplete_fields = ["brand", "category"]
    prepopulated_fields = {"slug": ("model_name", "model_number")}


@admin.register(CompatibilityMapping)
class CompatibilityMappingAdmin(admin.ModelAdmin):
    """
    Standalone M2M Mapping Admin using fast autocomplete for high-volume inventory management.
    """

    list_display = ("device_model", "product", "note", "created_at")
    list_filter = ("device_model__brand", "device_model__category")
    search_fields = (
        "device_model__model_name",
        "device_model__model_number",
        "product__name",
        "product__sku",
    )
    autocomplete_fields = ["device_model", "product"]
