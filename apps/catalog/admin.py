from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from apps.catalog.models import Brand, Category, Product, ProductImage, ProductVariant


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ("image", "alt_text", "is_primary")


class ProductVariantInline(admin.StackedInline):
    model = ProductVariant
    extra = 1
    fields = ("sku", "attributes", "price_override")


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "created_at")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "parent", "slug", "created_at")
    list_filter = ("parent",)
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    """
    Rich Product Admin tailored for non-technical shop owners.
    """

    inlines = [ProductImageInline, ProductVariantInline]
    list_display = (
        "name",
        "sku",
        "brand",
        "category",
        "price",
        "mrp",
        "cartridge_type",
        "is_active",
        "created_at",
    )
    list_filter = ("is_active", "cartridge_type", "brand", "category")
    search_fields = ("name", "sku", "description")
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        (
            None,
            {
                "fields": ("sku", "name", "slug", "brand", "category", "is_active"),
            },
        ),
        (
            _("Pricing & Cartridge Details"),
            {
                "fields": ("price", "mrp", "cartridge_type"),
            },
        ),
        (
            _("Product Specification & Description"),
            {
                "fields": ("description", "specifications"),
            },
        ),
        (
            _("SEO Metadata"),
            {
                "classes": ("collapse",),
                "fields": ("meta_title", "meta_description"),
            },
        ),
        (
            _("Timestamps"),
            {
                "classes": ("collapse",),
                "fields": ("created_at", "updated_at"),
            },
        ),
    )


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ("product", "is_primary", "created_at")
    list_filter = ("is_primary",)
    search_fields = ("product__name", "product__sku", "alt_text")


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ("sku", "product", "price_override", "updated_at")
    search_fields = ("sku", "product__name", "product__sku")
