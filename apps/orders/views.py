import logging

from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.cart.services import CartService
from apps.orders.models import Order
from apps.orders.serializers import CheckoutSerializer, OrderCancelSerializer, OrderSerializer
from apps.orders.services import OrderService
from apps.users.models import Address

logger = logging.getLogger(__name__)


class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for user order history, order details, checkout, and cancellation.
    """

    permission_classes = [IsAuthenticated]
    serializer_class = OrderSerializer
    lookup_field = "order_number"

    def get_queryset(self):
        return (
            Order.objects.filter(user=self.request.user)
            .prefetch_related("items", "status_history")
            .order_by("-created_at")
        )

    @action(detail=False, methods=["post"], url_path="checkout")
    def checkout(self, request):
        """
        POST /api/orders/checkout/
        Processes checkout from the current active cart and specified shipping address.
        """
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        address_id = serializer.validated_data.get("address_id")
        address_dict = serializer.validated_data.get("shipping_address")
        payment_method = serializer.validated_data.get("payment_method", "cod")

        if address_id:
            try:
                addr_obj = Address.objects.get(pk=address_id, user=request.user)
                address_data = {
                    "street_address": addr_obj.street_address,
                    "city": addr_obj.city,
                    "state": addr_obj.state,
                    "postal_code": addr_obj.postal_code,
                    "country": addr_obj.country,
                    "recipient_name": f"{request.user.first_name} {request.user.last_name}".strip(),
                    "phone_number": request.user.phone_number,
                }
            except Address.DoesNotExist:
                return Response(
                    {
                        "success": False,
                        "error": {
                            "code": "invalid_address",
                            "message": f"Address ID {address_id} not found for user.",
                            "details": None,
                        },
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            address_data = address_dict

        cart = CartService.get_or_create_cart(request)

        try:
            order = OrderService.create_order_from_cart(
                user=request.user,
                cart=cart,
                address_data=address_data,
                payment_method=payment_method,
            )
        except DjangoValidationError as exc:
            msg = exc.message if hasattr(exc, "message") else (exc.messages[0] if exc.messages else str(exc))
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "checkout_validation_error",
                        "message": msg,
                        "details": None,
                    },
                    "detail": msg,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel_order(self, request, order_number=None):
        """
        POST /api/orders/<order_number>/cancel/
        Cancels an order if not yet shipped, restoring inventory stock.
        """
        serializer = OrderCancelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order = self.get_object()
        reason = serializer.validated_data["reason"]

        cancelled_order = OrderService.cancel_order(
            order=order, reason=reason, user=request.user
        )

        return Response(OrderSerializer(cancelled_order).data, status=status.HTTP_200_OK)
