import logging

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.cart.serializers import CartAddUpdateSerializer, CartSerializer
from apps.cart.services import CartService
from apps.catalog.models import Product, ProductVariant

logger = logging.getLogger(__name__)


class CartViewSet(viewsets.ViewSet):
    """
    ViewSet handling guest and authenticated Shopping Cart operations,
    item additions, quantity updates, item deletions, and cart merging.
    """

    permission_classes = [AllowAny]

    def list(self, request):
        """
        GET /api/cart/
        Returns the current user or guest cart details.
        """
        cart = CartService.get_or_create_cart(request)
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    @action(detail=False, methods=["post"], url_path="items")
    def add_item(self, request):
        """
        POST /api/cart/items/
        Adds an item to the shopping cart after stock limit validation.
        """
        serializer = CartAddUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product_id = serializer.validated_data["product_id"]
        variant_id = serializer.validated_data.get("variant_id")
        quantity = serializer.validated_data["quantity"]

        product = Product.objects.get(pk=product_id)
        variant = ProductVariant.objects.get(pk=variant_id) if variant_id else None

        cart = CartService.get_or_create_cart(request)
        CartService.add_item(cart, product, quantity, variant)

        return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["patch", "delete"], url_path=r"items/(?P<item_id>\d+)")
    def item_detail(self, request, item_id=None):
        """
        PATCH /api/cart/items/<item_id>/ -> Update item quantity.
        DELETE /api/cart/items/<item_id>/ -> Remove item from cart.
        """
        cart = CartService.get_or_create_cart(request)

        if request.method == "DELETE":
            CartService.remove_item(cart, int(item_id))
            return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)

        quantity = request.data.get("quantity")
        if quantity is None:
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "missing_quantity",
                        "message": "Field 'quantity' is required.",
                        "details": None,
                    },
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        CartService.update_quantity(cart, int(item_id), int(quantity))
        return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path="merge")
    def merge_cart(self, request):
        """
        POST /api/cart/merge/
        Merges guest cart (session_key) into current user cart upon login.
        """
        if not request.user.is_authenticated:
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "authentication_required",
                        "message": "User authentication is required to merge carts.",
                        "details": None,
                    },
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        session_key = request.data.get("session_key") or getattr(
            request.session, "session_key", None
        )
        if not session_key:
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "missing_session_key",
                        "message": "Field 'session_key' is required.",
                        "details": None,
                    },
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        merged_cart = CartService.merge_guest_cart_into_user_cart(session_key, request.user)
        if not merged_cart:
            merged_cart = CartService.get_or_create_cart(request)

        return Response(CartSerializer(merged_cart).data, status=status.HTTP_200_OK)
