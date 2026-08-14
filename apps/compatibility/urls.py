from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.compatibility.views import DeviceBrandViewSet, DeviceModelViewSet

app_name = "compatibility"

router = DefaultRouter()
router.register(r"brands", DeviceBrandViewSet, basename="brand")
router.register(r"devices", DeviceModelViewSet, basename="device")

urlpatterns = [
    path("", include(router.urls)),
]
