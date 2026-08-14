from rest_framework.throttling import AnonRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    """
    Rate limit throttle for user authentication login attempts.
    Configured to 5 requests per minute.
    """

    scope = "auth"


class RegisterRateThrottle(AnonRateThrottle):
    """
    Rate limit throttle for user account registration.
    Configured to 5 requests per minute.
    """

    scope = "auth"
