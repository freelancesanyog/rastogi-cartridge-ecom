import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import generics, status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from apps.cart.services import CartService
from apps.users.models import Address
from apps.users.serializers import (
    AddressSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
    UserSerializer,
)
from apps.users.tasks import send_password_reset_email
from apps.users.throttling import LoginRateThrottle, RegisterRateThrottle

logger = logging.getLogger(__name__)
User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """
    Endpoint for new user registration.
    """

    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    throttle_classes = [RegisterRateThrottle]


class CookieTokenObtainPairView(TokenObtainPairView):
    """
    Login endpoint that returns the access token in the response body,
    sets the refresh token in an HttpOnly cookie, and merges any active guest cart.
    """

    throttle_classes = [LoginRateThrottle]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            refresh_token = response.data.get("refresh")
            if refresh_token:
                # Remove refresh token from response body
                del response.data["refresh"]

                # Set refresh token as HttpOnly cookie
                cookie_max_age = int(
                    settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()
                )
                response.set_cookie(
                    key="refresh_token",
                    value=refresh_token,
                    httponly=True,
                    secure=not settings.DEBUG,
                    samesite="Lax",
                    max_age=cookie_max_age,
                    path="/",
                )

            # Trigger guest cart merge on login
            session_key = (
                request.COOKIES.get("sessionid")
                or request.data.get("session_key")
                or getattr(request.session, "session_key", None)
            )
            if session_key:
                try:
                    user = User.objects.get(email=request.data.get("email"))
                    CartService.merge_guest_cart_into_user_cart(session_key, user)
                except Exception as exc:
                    logger.error("Failed to merge guest cart on login: %s", exc)

        return response


class CookieTokenRefreshView(APIView):
    """
    Refresh access token by reading refresh token from HttpOnly cookie.
    """

    permission_classes = [AllowAny]
    throttle_classes = [LoginRateThrottle]

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get("refresh_token") or request.data.get("refresh")

        if not refresh_token:
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "missing_token",
                        "message": "Refresh token was not provided in cookie or request body.",
                        "details": None,
                    },
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            token = RefreshToken(refresh_token)
            new_access_token = str(token.access_token)

            response_data = {"access": new_access_token}
            response = Response(response_data, status=status.HTTP_200_OK)

            # Rotate refresh token if rotation enabled
            if settings.SIMPLE_JWT.get("ROTATE_REFRESH_TOKENS", False):
                token.set_jti()
                token.set_exp()
                new_refresh_token = str(token)
                cookie_max_age = int(
                    settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()
                )
                response.set_cookie(
                    key="refresh_token",
                    value=new_refresh_token,
                    httponly=True,
                    secure=not settings.DEBUG,
                    samesite="Lax",
                    max_age=cookie_max_age,
                    path="/",
                )

            return response
        except (TokenError, InvalidToken) as exc:
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "invalid_token",
                        "message": f"Invalid or expired refresh token: {exc}",
                        "details": None,
                    },
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )


class LogoutView(APIView):
    """
    Logout endpoint that clears the HttpOnly refresh token cookie
    and blacklists the token.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get("refresh_token") or request.data.get("refresh")

        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except (TokenError, InvalidToken):
                pass  # Token might already be expired or blacklisted

        response = Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)
        response.delete_cookie("refresh_token", path="/")
        return response


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Endpoint to retrieve or update current user profile details.
    """

    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class AddressViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user delivery addresses.
    """

    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class PasswordResetRequestView(APIView):
    """
    Endpoint to request a password reset email.
    """

    permission_classes = [AllowAny]
    throttle_classes = [LoginRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        try:
            user = User.objects.get(email=email)
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            send_password_reset_email.delay(user.pk, token, uid)
        except User.DoesNotExist:
            # Silence user existence check for security
            pass

        return Response(
            {
                "message": "If an account exists with this email, a password reset link has been sent."
            },
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    """
    Endpoint to set a new password using reset uid and token.
    """

    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        new_password = serializer.validated_data["new_password"]
        user.set_password(new_password)
        user.save()

        return Response(
            {"message": "Password has been reset successfully."},
            status=status.HTTP_200_OK,
        )
