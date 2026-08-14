from rest_framework import serializers

from apps.orders.models import Order, OrderItem, OrderStatusHistory


class OrderItemSerializer(serializers.ModelSerializer):
    line_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    product_id = serializers.SerializerMethodField()
    product_slug = serializers.SerializerMethodField()
    product_image = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = (
            "id",
            "product_id",
            "product_slug",
            "product_name",
            "product_sku",
            "product_image",
            "variant_sku",
            "unit_price",
            "quantity",
            "line_total",
        )

    def get_product_id(self, obj):
        from apps.catalog.models import Product
        p = Product.objects.filter(sku=obj.product_sku).first()
        return p.id if p else None

    def get_product_slug(self, obj):
        from apps.catalog.models import Product
        p = Product.objects.filter(sku=obj.product_sku).first()
        return p.slug if p else ""

    def get_product_image(self, obj):
        from apps.catalog.models import Product
        p = Product.objects.filter(sku=obj.product_sku).prefetch_related("images").first()
        if p:
            primary_img = p.images.filter(is_primary=True).first() or p.images.first()
            if primary_img and primary_img.image:
                return primary_img.image.url
        return None


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderStatusHistory
        fields = ("id", "from_status", "to_status", "comment", "created_at")


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = (
            "id",
            "order_number",
            "shipping_address",
            "status",
            "payment_status",
            "payment_method",
            "subtotal",
            "discount_amount",
            "coupon_code",
            "shipping_fee",
            "tax",
            "total_amount",
            "cancellation_reason",
            "items",
            "status_history",
            "created_at",
            "updated_at",
        )


class CheckoutSerializer(serializers.Serializer):
    address_id = serializers.IntegerField(required=False, allow_null=True)
    shipping_address = serializers.DictField(required=False, allow_null=True)
    payment_method = serializers.CharField(default="cod")

    def validate(self, attrs):
        if not attrs.get("address_id") and not attrs.get("shipping_address"):
            raise serializers.ValidationError(
                "Either 'address_id' or 'shipping_address' dictionary must be provided."
            )
        return attrs


class OrderCancelSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, default="", allow_blank=True)
    cancellation_reason = serializers.CharField(required=False, default="", allow_blank=True)

    def validate(self, attrs):
        if not attrs.get("reason") and attrs.get("cancellation_reason"):
            attrs["reason"] = attrs["cancellation_reason"]
        if not attrs.get("reason"):
            attrs["reason"] = "Cancelled by customer via account portal."
        return attrs
