from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.catalog.views import BrandViewSet, CategoryViewSet, ProductViewSet

app_name = "catalog"

router = DefaultRouter()
router.register(r"products", ProductViewSet, basename="product")
router.register(r"categories", CategoryViewSet, basename="category")
router.register(r"brands", BrandViewSet, basename="brand")

urlpatterns = [
    path("", include(router.urls)),
]
