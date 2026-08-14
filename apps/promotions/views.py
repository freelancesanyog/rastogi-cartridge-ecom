import logging

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.cart.serializers import CartSerializer
from apps.cart.services import CartService
from apps.promotions.serializers import CouponApplySerializer

logger = logging.getLogger(__name__)


class CouponViewSet(viewsets.ViewSet):
    """
    ViewSet handling coupon code validation and application/removal on active carts.
    """

    permission_classes = [AllowAny]

    @action(detail=False, methods=["post"], url_path="apply")
    def apply_coupon(self, request):
        """
        POST /api/v1/promotions/apply/
        Validates and attaches a coupon to the current cart.
        """
        serializer = CouponApplySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        code = serializer.validated_data["code"]
        cart = CartService.get_or_create_cart(request)

        updated_cart = CartService.apply_coupon(cart, code)
        return Response(CartSerializer(updated_cart).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["delete", "post"], url_path="remove")
    def remove_coupon(self, request):
        """
        DELETE /api/v1/promotions/remove/
        Removes attached coupon from current cart.
        """
        cart = CartService.get_or_create_cart(request)
        updated_cart = CartService.remove_coupon(cart)
        return Response(CartSerializer(updated_cart).data, status=status.HTTP_200_OK)
