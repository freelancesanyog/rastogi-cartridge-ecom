from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.promotions.views import CouponViewSet

app_name = "promotions"

router = DefaultRouter()
router.register(r"", CouponViewSet, basename="coupon")

urlpatterns = [
    path("", include(router.urls)),
]
