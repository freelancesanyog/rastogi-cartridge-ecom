import logging

from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle

from apps.reviews.models import ProductReview
from apps.reviews.serializers import ProductReviewCreateSerializer, ProductReviewSerializer
from apps.reviews.services import ReviewService

logger = logging.getLogger(__name__)


class ProductReviewViewSet(viewsets.ModelViewSet):
    """
    ViewSet for listing approved product reviews and submitting customer reviews for moderation.
    """

    permission_classes = [IsAuthenticatedOrReadOnly]
    serializer_class = ProductReviewSerializer
    throttle_classes = [UserRateThrottle]

    def get_queryset(self):
        queryset = ProductReview.objects.select_related("user", "product")
        if self.request.query_params.get("my_reviews") == "true" and self.request.user.is_authenticated:
            return queryset.filter(user=self.request.user)

        queryset = queryset.filter(is_approved=True)
        product_param = self.request.query_params.get("product")
        if product_param:
            if product_param.isdigit():
                queryset = queryset.filter(product_id=product_param)
            else:
                queryset = queryset.filter(product__slug=product_param)
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = ProductReviewCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product = serializer.validated_data["product"]
        rating = serializer.validated_data["rating"]
        comment = serializer.validated_data["comment"]

        review = ReviewService.create_review(
            user=request.user,
            product=product,
            rating=rating,
            comment=comment,
        )

        response_data = ProductReviewSerializer(review).data
        response_data["message"] = "Review submitted successfully and is pending admin moderation."
        return Response(response_data, status=status.HTTP_201_CREATED)
