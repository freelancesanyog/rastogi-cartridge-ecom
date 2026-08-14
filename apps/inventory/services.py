import logging

from django.db import transaction

from apps.catalog.models import Product, ProductVariant
from apps.inventory.exceptions import InsufficientStockError, StockRecordNotFoundError
from apps.inventory.models import StockRecord

logger = logging.getLogger(__name__)


class InventoryService:
    """
    Service layer providing concurrency-safe inventory operations
    using DB-level row locks (select_for_update) to prevent overselling.
    """

    @staticmethod
    @transaction.atomic
    def reserve_stock(stock_record_id: int, quantity: int) -> StockRecord:
        """
        Reserves stock quantity for a pending order.
        Thread-safe under concurrent access via select_for_update().
        """
        if quantity <= 0:
            raise ValueError("Reservation quantity must be greater than zero.")

        try:
            record = StockRecord.objects.select_for_update().get(pk=stock_record_id)
        except StockRecord.DoesNotExist as exc:
            raise StockRecordNotFoundError(f"StockRecord {stock_record_id} not found.") from exc

        if record.available_quantity < quantity:
            raise InsufficientStockError(
                f"Cannot reserve {quantity} units. Only {record.available_quantity} available."
            )

        record.reserved_quantity += quantity
        record.save()
        logger.info("Reserved %s units for StockRecord %s.", quantity, stock_record_id)
        return record

    @staticmethod
    @transaction.atomic
    def release_stock(stock_record_id: int, quantity: int) -> StockRecord:
        """
        Releases previously reserved stock quantity (e.g. order cancelled or expired).
        Thread-safe via select_for_update().
        """
        if quantity <= 0:
            raise ValueError("Release quantity must be greater than zero.")

        try:
            record = StockRecord.objects.select_for_update().get(pk=stock_record_id)
        except StockRecord.DoesNotExist as exc:
            raise StockRecordNotFoundError(f"StockRecord {stock_record_id} not found.") from exc

        release_qty = min(quantity, record.reserved_quantity)
        record.reserved_quantity -= release_qty
        record.save()
        logger.info("Released %s reserved units for StockRecord %s.", release_qty, stock_record_id)
        return record

    @staticmethod
    @transaction.atomic
    def deduct_stock(stock_record_id: int, quantity: int, from_reserved: bool = True) -> StockRecord:
        """
        Deducts physical stock quantity upon order completion.
        Thread-safe under concurrent access via select_for_update().
        """
        if quantity <= 0:
            raise ValueError("Deduction quantity must be greater than zero.")

        try:
            record = StockRecord.objects.select_for_update().get(pk=stock_record_id)
        except StockRecord.DoesNotExist as exc:
            raise StockRecordNotFoundError(f"StockRecord {stock_record_id} not found.") from exc

        if record.available_quantity < quantity or record.quantity < quantity:
            raise InsufficientStockError(
                f"Cannot deduct {quantity} units. Available stock is {record.available_quantity}."
            )

        if from_reserved:
            if record.reserved_quantity < quantity:
                record.reserved_quantity = 0
            else:
                record.reserved_quantity -= quantity

        record.quantity -= quantity
        record.save()
        logger.info("Deducted %s units from StockRecord %s.", quantity, stock_record_id)
        return record

    @staticmethod
    @transaction.atomic
    def restore_stock(stock_record_id: int, quantity: int) -> StockRecord:
        """
        Restores stock quantity back into inventory (e.g. order cancelled before delivery).
        Thread-safe via select_for_update().
        """
        if quantity <= 0:
            raise ValueError("Restoration quantity must be greater than zero.")

        try:
            record = StockRecord.objects.select_for_update().get(pk=stock_record_id)
        except StockRecord.DoesNotExist as exc:
            raise StockRecordNotFoundError(f"StockRecord {stock_record_id} not found.") from exc

        record.quantity += quantity
        record.save()
        logger.info("Restored %s units to StockRecord %s.", quantity, stock_record_id)
        return record

    @staticmethod
    def get_stock_status(target) -> dict:
        """
        Computes stock availability status for a Product or ProductVariant
        STRICTLY from StockRecord objects. Never falls back to ProductVariant.stock.
        """
        total_available = 0
        is_low = False

        if isinstance(target, Product):
            if target.variants.exists():
                records = StockRecord.objects.filter(variant__product=target)
            else:
                records = StockRecord.objects.filter(product=target, variant__isnull=True)

            if records.exists():
                total_available = sum(r.available_quantity for r in records)
                is_low = any(r.is_low_stock for r in records)

        elif isinstance(target, ProductVariant):
            records = StockRecord.objects.filter(variant=target)
            if records.exists():
                total_available = sum(r.available_quantity for r in records)
                is_low = any(r.is_low_stock for r in records)

        else:
            return {
                "in_stock": False,
                "status": "out_of_stock",
                "available_quantity": 0,
                "is_low_stock": False,
            }

        if total_available <= 0:
            return {
                "in_stock": False,
                "status": "out_of_stock",
                "available_quantity": 0,
                "is_low_stock": False,
            }

        status_label = "low_stock" if is_low else "in_stock"

        return {
            "in_stock": True,
            "status": status_label,
            "available_quantity": total_available,
            "is_low_stock": is_low,
        }

    @staticmethod
    def get_bulk_stock_status(product: Product) -> dict:
        """
        Bulk computes stock status for a Product and all its variants in 1-2 DB queries.
        Returns:
        {
            "product": {
                "available_quantity": 12,
                "in_stock": True,
                "low_stock": False
            },
            "variants": {
                "101": {
                    "available_quantity": 5,
                    "in_stock": True,
                    "low_stock": False
                },
                "102": {
                    "available_quantity": 0,
                    "in_stock": False,
                    "low_stock": False
                }
            }
        }
        """
        variants = list(product.variants.all())
        variant_stocks = {}
        total_available = 0
        product_is_low = False

        if variants:
            records = list(StockRecord.objects.filter(variant__product=product))
            records_by_variant = {}
            for rec in records:
                if rec.variant_id not in records_by_variant:
                    records_by_variant[rec.variant_id] = []
                records_by_variant[rec.variant_id].append(rec)

            for v in variants:
                v_recs = records_by_variant.get(v.id, [])
                v_avail = sum(r.available_quantity for r in v_recs) if v_recs else 0
                v_is_low = any(r.is_low_stock for r in v_recs) if v_recs else False
                v_in_stock = v_avail > 0

                variant_stocks[str(v.id)] = {
                    "available_quantity": max(0, v_avail),
                    "in_stock": v_in_stock,
                    "low_stock": v_is_low,
                }

                total_available += max(0, v_avail)
                if v_is_low:
                    product_is_low = True
        else:
            p_recs = list(StockRecord.objects.filter(product=product, variant__isnull=True))
            total_available = sum(r.available_quantity for r in p_recs) if p_recs else 0
            product_is_low = any(r.is_low_stock for r in p_recs) if p_recs else False

        product_in_stock = total_available > 0

        return {
            "product": {
                "available_quantity": max(0, total_available),
                "in_stock": product_in_stock,
                "low_stock": product_is_low,
            },
            "variants": variant_stocks,
        }

