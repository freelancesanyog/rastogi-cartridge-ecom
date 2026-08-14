from django.core.cache import cache
from django.db import connection
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.serializers import ContactMessageSerializer
from apps.core.tasks import send_contact_email_task


class HealthCheckView(APIView):
    permission_classes = []
    throttle_classes = []

    def get(self, request):
        services = {"database": "unknown", "redis": "unknown"}

        # 1. Database Check
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                row = cursor.fetchone()
                if row and row[0] == 1:
                    services["database"] = "ok"
                else:
                    services["database"] = "error"
        except Exception:
            services["database"] = "error"

        # 2. Redis Cache Check
        try:
            cache.set("health_check_key", "ok", 10)
            val = cache.get("health_check_key")
            if val == "ok":
                services["redis"] = "ok"
            else:
                services["redis"] = "error"
        except Exception:
            services["redis"] = "error"

        is_healthy = all(status == "ok" for status in services.values())
        response_status = status.HTTP_200_OK if is_healthy else status.HTTP_503_SERVICE_UNAVAILABLE

        return Response(
            {
                "status": "healthy" if is_healthy else "unhealthy",
                "services": services,
            },
            status=response_status,
        )


class ContactView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ContactMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        send_contact_email_task.delay(
            data["name"],
            data["email"],
            data["subject"],
            data["message"],
        )

        return Response(
            {"message": "Thank you for contacting us! We will get back to you shortly."},
            status=status.HTTP_202_ACCEPTED,
        )
