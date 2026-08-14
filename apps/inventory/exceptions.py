class InsufficientStockError(Exception):
    """
    Raised when requested stock deduction or reservation exceeds available stock.
    """

    pass


class StockRecordNotFoundError(Exception):
    """
    Raised when an inventory StockRecord is not found for a product/variant.
    """

    pass
