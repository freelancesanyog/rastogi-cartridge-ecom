from unittest.mock import MagicMock, patch

from django.urls import reverse
from rest_framework import status


def test_health_check_endpoint_success(client):
    """
    Test that the /api/health/ endpoint returns HTTP 200 when DB and Redis are healthy.
    """
    url = reverse("core:health_check")
    mock_cursor = MagicMock()
    mock_cursor.fetchone.return_value = (1,)

    with patch("apps.core.views.connection.cursor") as mock_conn_cursor, \
         patch("apps.core.views.cache.set", return_value=True), \
         patch("apps.core.views.cache.get", return_value="ok"):
        mock_conn_cursor.return_value.__enter__.return_value = mock_cursor
        response = client.get(url)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "healthy"
        assert data["services"]["database"] == "ok"
        assert data["services"]["redis"] == "ok"


def test_health_check_endpoint_degraded(client):
    """
    Test that the /api/health/ endpoint returns HTTP 503 when Redis fails.
    """
    url = reverse("core:health_check")
    mock_cursor = MagicMock()
    mock_cursor.fetchone.return_value = (1,)

    with patch("apps.core.views.connection.cursor") as mock_conn_cursor, \
         patch("apps.core.views.cache.get", side_effect=Exception("Redis Connection Error")):
        mock_conn_cursor.return_value.__enter__.return_value = mock_cursor
        response = client.get(url)
        assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
        data = response.json()
        assert data["status"] == "unhealthy"
        assert data["services"]["redis"] == "error"
