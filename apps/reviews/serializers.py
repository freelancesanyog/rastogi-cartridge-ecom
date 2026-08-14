from rest_framework import serializers

from apps.reviews.models import ProductReview


class ProductReviewSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = ProductReview
        fields = ("id", "user_email", "product", "rating", "comment", "is_approved", "created_at")
        read_only_fields = ("id", "user_email", "is_approved", "created_at")


class ProductReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductReview
        fields = ("product", "rating", "comment")

    def validate_rating(self, value):
        if not (1 <= value <= 5):
            raise serializers.ValidationError("Rating must be an integer between 1 and 5.")
        return value
