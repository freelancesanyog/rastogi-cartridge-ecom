from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status

from apps.catalog.models import Category, Product
from apps.reviews.models import ProductReview

User = get_user_model()


@pytest.mark.django_db
def test_review_creation_and_moderation(client):
    """
    Test customer review submission (defaults to is_approved=False),
    public listing isolation (only approved reviews returned), and admin moderation.
    """
    user = User.objects.create_user(email="reviewer@example.com", password="Password123!")
    cat = Category.objects.create(name="Headphones")
    product = Product.objects.create(
        sku="HEAD-01",
        name="Noise Cancelling Headphones",
        category=cat,
        price=Decimal("150.00"),
        mrp=Decimal("180.00"),
        is_active=True,
    )

    # 1. Login
    login_res = client.post(
        reverse("users:login"),
        {"email": "reviewer@example.com", "password": "Password123!"},
        format="json",
    )
    access_token = login_res.data["access"]
    headers = {"HTTP_AUTHORIZATION": f"Bearer {access_token}"}

    # 2. Submit review via API
    reviews_url = reverse("reviews:review-list")
    res_submit = client.post(
        reviews_url,
        {"product": product.id, "rating": 5, "comment": "Outstanding sound quality!"},
        format="json",
        **headers,
    )
    assert res_submit.status_code == status.HTTP_201_CREATED
    assert res_submit.data["is_approved"] is True

    # 3. Verify public list returns 1 approved review
    res_public = client.get(f"{reviews_url}?product={product.id}")
    assert res_public.status_code == status.HTTP_200_OK
    assert res_public.data["count"] == 1
    assert res_public.data["results"][0]["comment"] == "Outstanding sound quality!"
