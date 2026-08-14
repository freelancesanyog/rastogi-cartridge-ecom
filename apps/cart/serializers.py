from rest_framework import serializers

from apps.cart.models import Cart, CartItem
from apps.cart.services import CartService
from apps.catalog.models import Product, ProductVariant
from apps.catalog.serializers import ProductListSerializer, ProductVariantSerializer


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    variant = ProductVariantSerializer(read_only=True)
    line_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ("id", "product", "variant", "quantity", "price_at_add", "line_total")


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    subtotal = serializers.SerializerMethodField()
    discount_amount = serializers.SerializerMethodField()
    total_amount = serializers.SerializerMethodField()
    item_count = serializers.SerializerMethodField()
    coupon_code = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = (
            "id",
            "is_active",
            "items",
            "subtotal",
            "discount_amount",
            "total_amount",
            "item_count",
            "coupon_code",
        )

    def get_subtotal(self, obj):
        return CartService.get_cart_totals(obj)["subtotal"]

    def get_discount_amount(self, obj):
        return CartService.get_cart_totals(obj)["discount_amount"]

    def get_total_amount(self, obj):
        return CartService.get_cart_totals(obj)["total_amount"]

    def get_item_count(self, obj):
        return CartService.get_cart_totals(obj)["item_count"]

    def get_coupon_code(self, obj):
        return CartService.get_cart_totals(obj)["coupon_code"]


class CartAddUpdateSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    variant_id = serializers.IntegerField(required=False, allow_null=True)
    quantity = serializers.IntegerField(default=1, min_value=1)

    def validate_product_id(self, value):
        if not Product.objects.filter(pk=value, is_active=True).exists():
            raise serializers.ValidationError("Active product with specified ID does not exist.")
        return value

    def validate_variant_id(self, value):
        if value and not ProductVariant.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Product variant with specified ID does not exist.")
        return value
