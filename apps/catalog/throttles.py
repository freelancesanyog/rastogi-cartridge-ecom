from rest_framework.throttling import ScopedRateThrottle


class StockPollingThrottle(ScopedRateThrottle):
    """
    Dedicated throttle rate for live stock polling endpoint.
    Scope 'stock_polling' is configured to allow high-frequency polling
    without being rate-limited by default DRF catalog limits.
    """

    scope = "stock_polling"
