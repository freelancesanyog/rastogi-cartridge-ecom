import pytest
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.urls import reverse
from rest_framework import status

from apps.users.models import Address

User = get_user_model()


@pytest.fixture(autouse=True)
def clear_cache_between_tests():
    cache.clear()
    yield
    cache.clear()


@pytest.mark.django_db
def test_get_and_update_user_profile(client):
    """
    Test retrieving and updating user profile (/api/users/me/).
    """
    user = User.objects.create_user(
        email="profile@example.com",
        password="Password123!",
        first_name="Jane",
        last_name="Smith",
    )

    # Login to get token
    login_url = reverse("users:login")
    login_res = client.post(
        login_url, {"email": "profile@example.com", "password": "Password123!"}, format="json"
    )
    access_token = login_res.data["access"]

    profile_url = reverse("users:user_profile")
    headers = {"HTTP_AUTHORIZATION": f"Bearer {access_token}"}

    # GET Profile
    get_res = client.get(profile_url, **headers)
    assert get_res.status_code == status.HTTP_200_OK
    assert get_res.data["email"] == "profile@example.com"
    assert get_res.data["first_name"] == "Jane"

    # PATCH Profile
    patch_res = client.patch(
        profile_url,
        {"first_name": "Janet", "phone_number": "+9876543210"},
        content_type="application/json",
        **headers,
    )
    assert patch_res.status_code == status.HTTP_200_OK
    assert patch_res.data["first_name"] == "Janet"
    assert patch_res.data["phone_number"] == "+9876543210"

    user.refresh_from_db()
    assert user.first_name == "Janet"


@pytest.mark.django_db
def test_address_crud_and_default_flag_logic(client):
    """
    Test address CRUD operations and single default address enforcement.
    """
    User.objects.create_user(email="address@example.com", password="Password123!")
    login_url = reverse("users:login")
    login_res = client.post(
        login_url, {"email": "address@example.com", "password": "Password123!"}, format="json"
    )
    access_token = login_res.data["access"]
    headers = {"HTTP_AUTHORIZATION": f"Bearer {access_token}"}

    address_list_url = reverse("users:address-list")

    # 1. Create first address (should auto-become default)
    addr1_payload = {
        "street_address": "123 Main St",
        "city": "Springfield",
        "state": "IL",
        "postal_code": "62701",
        "country": "United States",
        "is_default": False,
    }
    res1 = client.post(address_list_url, addr1_payload, format="json", **headers)
    assert res1.status_code == status.HTTP_201_CREATED
    addr1_id = res1.data["id"]
    assert res1.data["is_default"] is True  # Auto set to default

    # 2. Create second address with is_default=True
    addr2_payload = {
        "street_address": "456 Market St",
        "city": "Springfield",
        "state": "IL",
        "postal_code": "62702",
        "country": "United States",
        "is_default": True,
    }
    res2 = client.post(address_list_url, addr2_payload, format="json", **headers)
    assert res2.status_code == status.HTTP_201_CREATED
    assert res2.data["is_default"] is True

    # Check that addr1 is no longer default
    addr1_obj = Address.objects.get(pk=addr1_id)
    assert addr1_obj.is_default is False
