import logging

from celery import shared_task

from apps.inventory.models import StockRecord

logger = logging.getLogger(__name__)


@shared_task
def check_low_stock_levels_task():
    """
    Daily Celery Beat task querying inventory stock records to identify items
    below their low stock threshold and triggering summary notifications.
    """
    logger.info("Executing daily low-stock inspection task...")

    low_stock_records = [
        r for r in StockRecord.objects.select_related("product", "variant").all() if r.is_low_stock or r.available_quantity == 0
    ]

    if not low_stock_records:
        logger.info("Low-stock check completed: All inventory items are adequately stocked.")
        return "All items adequately stocked."

    summary_lines = []
    for record in low_stock_records:
        item_name = record.variant or record.product or "Unknown Item"
        status_text = "OUT OF STOCK" if record.available_quantity == 0 else "LOW STOCK"
        summary_lines.append(
            f"[{status_text}] {item_name} - Available: {record.available_quantity} (Threshold: {record.low_stock_threshold})"
        )

    summary_text = "\n".join(summary_lines)

    # Stub notification channel (logs summary clearly to console / logger)
    logger.warning(
        "LOW STOCK WARNING SUMMARY:\n%s\n---\nTotal items requiring restock: %s",
        summary_text,
        len(low_stock_records),
    )

    return f"Logged warning for {len(low_stock_records)} low-stock items."
