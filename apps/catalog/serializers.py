from rest_framework import serializers

from apps.catalog.models import Brand, Category, Product, ProductImage, ProductVariant
from apps.catalog.services import CatalogService
from apps.inventory.services import InventoryService


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ("id", "name", "slug", "logo", "description")


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = (
            "id",
            "name",
            "slug",
            "parent",
            "meta_title",
            "meta_description",
            "requires_compatibility_mapping",
        )


class CategoryTreeSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = (
            "id",
            "name",
            "slug",
            "meta_title",
            "meta_description",
            "requires_compatibility_mapping",
            "children",
        )

    def get_children(self, obj):
        if obj.children.exists():
            return CategoryTreeSerializer(obj.children.all(), many=True).data
        return []


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ("id", "image", "alt_text", "is_primary")

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if ret.get("image") and ret["image"].startswith("/"):
            request = self.context.get("request")
            if request:
                ret["image"] = request.build_absolute_uri(ret["image"])
            else:
                ret["image"] = f"http://localhost:8001{ret['image']}"
        return ret


class ProductVariantSerializer(serializers.ModelSerializer):
    effective_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    stock_status = serializers.SerializerMethodField()

    class Meta:
        model = ProductVariant
        fields = ("id", "sku", "attributes", "price_override", "effective_price", "stock", "stock_status")

    def get_stock_status(self, obj):
        bulk_map = self.context.get("bulk_stock_map")
        if bulk_map and "variants" in bulk_map and str(obj.id) in bulk_map["variants"]:
            v_info = bulk_map["variants"][str(obj.id)]
            status_label = "low_stock" if v_info["low_stock"] else ("in_stock" if v_info["in_stock"] else "out_of_stock")
            return {
                "in_stock": v_info["in_stock"],
                "status": status_label,
                "available_quantity": v_info["available_quantity"],
                "is_low_stock": v_info["low_stock"],
            }
        return InventoryService.get_stock_status(obj)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        stock_info = data.get("stock_status") or self.get_stock_status(instance)
        data["stock"] = stock_info.get("available_quantity", 0)
        return data


class ProductListSerializer(serializers.ModelSerializer):
    brand = BrandSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    primary_image = serializers.SerializerMethodField()
    discount_percentage = serializers.SerializerMethodField()
    stock_status = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id",
            "sku",
            "name",
            "slug",
            "brand",
            "category",
            "price",
            "mrp",
            "cartridge_type",
            "is_active",
            "primary_image",
            "discount_percentage",
            "stock_status",
        )

    def get_primary_image(self, obj):
        primary_img = obj.images.filter(is_primary=True).first() or obj.images.first()
        if primary_img:
            return ProductImageSerializer(primary_img, context=self.context).data
        return None

    def get_discount_percentage(self, obj):
        return CatalogService.calculate_discount_percentage(obj)

    def get_stock_status(self, obj):
        return InventoryService.get_stock_status(obj)


class ProductDetailSerializer(serializers.ModelSerializer):
    brand = BrandSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    primary_image = serializers.SerializerMethodField()
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    discount_percentage = serializers.SerializerMethodField()
    stock_status = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id",
            "sku",
            "name",
            "slug",
            "brand",
            "category",
            "description",
            "price",
            "mrp",
            "specifications",
            "meta_title",
            "meta_description",
            "cartridge_type",
            "is_active",
            "primary_image",
            "images",
            "variants",
            "discount_percentage",
            "stock_status",
            "created_at",
            "updated_at",
        )

    def get_primary_image(self, obj):
        primary_img = obj.images.filter(is_primary=True).first() or obj.images.first()
        if primary_img:
            return ProductImageSerializer(primary_img, context=self.context).data
        return None

    def get_discount_percentage(self, obj):
        return CatalogService.calculate_discount_percentage(obj)

    def get_stock_status(self, obj):
        return InventoryService.get_stock_status(obj)
