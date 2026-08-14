import logging

from django.http import JsonResponse

logger = logging.getLogger(__name__)


class GlobalExceptionMiddleware:
    """
    Middleware to catch unhandled exceptions outside DRF views
    and return a structured JSON response envelope instead of raw HTML error pages.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        return response

    def process_exception(self, request, exception):
        logger.exception("Unhandled exception occurred: %s", exception)

        if request.path.startswith("/api/"):
            return JsonResponse(
                {
                    "success": False,
                    "error": {
                        "code": "internal_server_error",
                        "message": "An unhandled server error occurred.",
                        "details": None,
                    },
                },
                status=500,
            )
        return None
