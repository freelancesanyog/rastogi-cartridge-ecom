from rest_framework.exceptions import ValidationError
from rest_framework.test import APIRequestFactory

from apps.core.exceptions import custom_exception_handler
from apps.core.models import TimeStampedModel
from apps.core.pagination import StandardResultsSetPagination


def test_timestamped_model_abstract_attribute():
    assert TimeStampedModel._meta.abstract is True


def test_custom_exception_handler_formatting():
    """
    Verify that custom_exception_handler returns structured envelope.
    """
    exc = ValidationError(detail={"email": ["This field is required."]})
    response = custom_exception_handler(exc, context={})

    assert response is not None
    assert response.data["success"] is False
    assert response.data["error"]["code"] == "invalid"
    assert "email" in response.data["error"]["details"]


def test_pagination_envelope():
    """
    Verify pagination response structure.
    """
    pagination = StandardResultsSetPagination()
    pagination.page_size = 2

    # Mock page paginator
    class DummyPage:
        number = 1
        paginator = type("Paginator", (), {"count": 5, "num_pages": 3})()

        def has_next(self):
            return True

        def has_previous(self):
            return False

        def next_page_number(self):
            return 2

        def previous_page_number(self):
            return None

    pagination.page = DummyPage()
    pagination.request = APIRequestFactory().get("/api/dummy/")

    response = pagination.get_paginated_response(["item1", "item2"])
    data = response.data

    assert data["success"] is True
    assert data["count"] == 5
    assert data["total_pages"] == 3
    assert data["current_page"] == 1
    assert data["results"] == ["item1", "item2"]
