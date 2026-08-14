from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from rest_framework import serializers

from apps.users.models import Address

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration.
    """

    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(
        write_only=True, min_length=8, required=False, allow_blank=True
    )

    class Meta:
        model = User
        fields = ("id", "email", "password", "password_confirm", "first_name", "last_name", "phone_number")

    def validate(self, attrs):
        confirm = attrs.get("password_confirm")
        if confirm and attrs["password"] != confirm:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm", None)
        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            phone_number=validated_data.get("phone_number", ""),
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for retrieving and updating user profile details.
    """

    class Meta:
        model = User
        fields = ("id", "email", "first_name", "last_name", "phone_number", "date_joined")
        read_only_fields = ("id", "email", "date_joined")


class AddressSerializer(serializers.ModelSerializer):
    """
    Serializer for User Addresses.
    """

    class Meta:
        model = Address
        fields = (
            "id",
            "street_address",
            "city",
            "state",
            "postal_code",
            "country",
            "is_default",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class PasswordResetRequestSerializer(serializers.Serializer):
    """
    Serializer for requesting a password reset email.
    """

    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """
    Serializer for confirming a password reset using uid and token.
    """

    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8)

    def validate(self, attrs):
        try:
            uid = force_str(urlsafe_base64_decode(attrs["uid"]))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist) as exc:
            raise serializers.ValidationError({"uid": "Invalid user ID."}) from exc

        if not default_token_generator.check_token(user, attrs["token"]):
            raise serializers.ValidationError({"token": "Invalid or expired password reset token."})

        attrs["user"] = user
        return attrs
