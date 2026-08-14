import logging

from celery import shared_task
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


@shared_task
def send_password_reset_email(user_id, token, uid):
    """
    Celery task to asynchronously dispatch a password reset email.
    """
    User = get_user_model()
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        logger.error("Password reset task failed: User with ID %s not found.", user_id)
        return

    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
    reset_url = f"{frontend_url}/reset-password?uid={uid}&token={token}"

    subject = "Password Reset Request - Rastogi Cartridge"
    message = (
        f"Hello {user.first_name or user.email},\n\n"
        f"You requested a password reset for your Rastogi Cartridge account.\n\n"
        f"Click the link below to reset your password:\n"
        f"{reset_url}\n\n"
        f"Direct Reset Link:\n"
        f"{reset_url}\n\n"
        f"Or use these credentials manually:\n"
        f"UID: {uid}\n"
        f"Token: {token}\n\n"
        f"If you did not request this, please ignore this email.\n\n"
        f"Best regards,\n"
        f"Rastogi Cartridge Team"
    )

    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "Rastogi Cartridge <noreply@rastogicartridge.com>")
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=from_email,
            recipient_list=[user.email],
            fail_silently=False,
        )
        logger.info("Password reset email sent to %s with link: %s", user.email, reset_url)
    except Exception as exc:
        logger.error("Failed to send email to %s via SMTP: %s. Reset link: %s", user.email, exc, reset_url)
