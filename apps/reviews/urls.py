from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.reviews.views import ProductReviewViewSet

app_name = "reviews"

router = DefaultRouter()
router.register(r"", ProductReviewViewSet, basename="review")

urlpatterns = [
    path("", include(router.urls)),
]
