import logging

from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom DRF exception handler providing a consistent error response envelope:
    {
        "success": false,
        "error": {
            "code": "error_code",
            "message": "Readable description",
            "details": {...}
        }
    }
    """
    # Convert Django ValidationError directly into a 400 Bad Request Response
    if isinstance(exc, DjangoValidationError):
        msg = (
            exc.message
            if hasattr(exc, "message")
            else (exc.messages[0] if getattr(exc, "messages", None) else str(exc))
        )
        return Response(
            {
                "success": False,
                "error": {
                    "code": "validation_error",
                    "message": str(msg),
                    "details": None,
                },
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Call DRF's default exception handler first for DRF exceptions
    response = exception_handler(exc, context)

    if response is not None:
        error_code = getattr(exc, "default_code", "error")
        code_str = str(error_code) if not isinstance(error_code, str) else error_code

        message = "An error occurred while processing your request."
        details = response.data

        # Extract clear human-readable error message
        if isinstance(details, dict):
            if "detail" in details:
                message = str(details["detail"])
                details = {k: v for k, v in details.items() if k != "detail"}
            elif "non_field_errors" in details and isinstance(details["non_field_errors"], list):
                message = str(details["non_field_errors"][0])
            else:
                first_key = next(iter(details), None)
                if first_key and isinstance(details[first_key], list) and details[first_key]:
                    message = f"{first_key.replace('_', ' ').capitalize()}: {details[first_key][0]}"
        elif isinstance(details, list) and len(details) > 0:
            message = str(details[0])

        custom_response_data = {
            "success": False,
            "error": {
                "code": code_str,
                "message": message,
                "details": details if details else None,
            },
        }
        response.data = custom_response_data
    else:
        logger.exception("Unhandled exception in DRF view: %s", exc)

        response = Response(
            {
                "success": False,
                "error": {
                    "code": "server_error",
                    "message": "An unexpected internal server error occurred.",
                    "details": None,
                },
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return response
