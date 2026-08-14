from unittest.mock import patch

import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.cache import cache
from django.urls import reverse
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import status

User = get_user_model()


@pytest.fixture(autouse=True)
def clear_cache_between_tests():
    cache.clear()
    yield
    cache.clear()


@pytest.mark.django_db
def test_user_registration(client):
    """
    Test user account registration.
    """
    url = reverse("users:register")
    payload = {
        "email": "customer@example.com",
        "password": "StrongPassword123!",
        "password_confirm": "StrongPassword123!",
        "first_name": "John",
        "last_name": "Doe",
        "phone_number": "+1234567890",
    }
    response = client.post(url, payload, format="json")
    assert response.status_code == status.HTTP_201_CREATED
    assert User.objects.filter(email="customer@example.com").exists()
    user = User.objects.get(email="customer@example.com")
    assert user.first_name == "John"


@pytest.mark.django_db
def test_user_login_success(client):
    """
    Test successful user login returning access token in response body
    and refresh token in HttpOnly cookie.
    """
    user = User.objects.create_user(email="login@example.com", password="SecurePassword123!")
    url = reverse("users:login")
    payload = {"email": user.email, "password": "SecurePassword123!"}

    response = client.post(url, payload, format="json")
    assert response.status_code == status.HTTP_200_OK
    assert "access" in response.data
    assert "refresh" not in response.data  # Refresh token should be in cookie, not body

    # Verify HttpOnly cookie
    assert "refresh_token" in response.cookies
    cookie = response.cookies["refresh_token"]
    assert cookie["httponly"] is True


@pytest.mark.django_db
def test_user_login_negative_wrong_password(client):
    """
    Negative test case: Login attempt with incorrect password.
    Should return HTTP 401 and structured error response envelope.
    """
    User.objects.create_user(email="wrongpass@example.com", password="CorrectPassword123!")
    url = reverse("users:login")
    payload = {"email": "wrongpass@example.com", "password": "WrongPassword123!"}

    response = client.post(url, payload, format="json")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "authentication_failed"


@pytest.mark.django_db
def test_token_refresh_success(client):
    """
    Test token refresh endpoint reading refresh_token from HttpOnly cookie.
    """
    User.objects.create_user(email="refreshtest@example.com", password="Password123!")
    login_url = reverse("users:login")
    login_res = client.post(
        login_url, {"email": "refreshtest@example.com", "password": "Password123!"}, format="json"
    )
    refresh_cookie = login_res.cookies["refresh_token"].value

    refresh_url = reverse("users:token_refresh")
    client.cookies["refresh_token"] = refresh_cookie

    refresh_res = client.post(refresh_url, format="json")
    assert refresh_res.status_code == status.HTTP_200_OK
    assert "access" in refresh_res.data


@pytest.mark.django_db
def test_user_logout(client):
    """
    Test logout endpoint clearing refresh cookie and blacklisting token.
    """
    User.objects.create_user(email="logouttest@example.com", password="Password123!")
    login_url = reverse("users:login")
    login_res = client.post(
        login_url, {"email": "logouttest@example.com", "password": "Password123!"}, format="json"
    )

    access_token = login_res.data["access"]
    refresh_cookie = login_res.cookies["refresh_token"].value

    logout_url = reverse("users:logout")
    client.cookies["refresh_token"] = refresh_cookie

    logout_res = client.post(
        logout_url, HTTP_AUTHORIZATION=f"Bearer {access_token}", format="json"
    )
    assert logout_res.status_code == status.HTTP_200_OK
    # Cookie should be cleared
    assert logout_res.cookies["refresh_token"].value == ""


@pytest.mark.django_db
@patch("apps.users.views.send_password_reset_email.delay")
def test_password_reset_flow(mock_task, client):
    """
    Test password reset request dispatches Celery task and confirmation updates password.
    """
    user = User.objects.create_user(email="resetpass@example.com", password="OldPassword123!")

    # 1. Request Reset
    request_url = reverse("users:password_reset_request")
    res = client.post(request_url, {"email": user.email}, format="json")
    assert res.status_code == status.HTTP_200_OK
    assert mock_task.called

    # 2. Confirm Reset
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)

    confirm_url = reverse("users:password_reset_confirm")
    confirm_payload = {"uid": uid, "token": token, "new_password": "NewSecretPassword123!"}
    confirm_res = client.post(confirm_url, confirm_payload, format="json")

    assert confirm_res.status_code == status.HTTP_200_OK

    # Verify new password
    user.refresh_from_db()
    assert user.check_password("NewSecretPassword123!")
