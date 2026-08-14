from django.urls import path

from apps.core.views import ContactView, HealthCheckView

app_name = "core"

urlpatterns = [
    path("health/", HealthCheckView.as_view(), name="health_check"),
    path("contact/", ContactView.as_view(), name="contact"),
]
