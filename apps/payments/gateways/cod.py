import uuid

from apps.payments.gateways.base import BasePaymentGateway
from apps.payments.models import PaymentTransaction, TransactionStatus


class CODGateway(BasePaymentGateway):
    """
    Cash on Delivery (COD) Payment Gateway Implementation.
    Marks transaction as pending collection on delivery.
    """

    def process_payment(self, order):
        txn_id = f"COD-{uuid.uuid4().hex[:12].upper()}"
        transaction_obj = PaymentTransaction.objects.create(
            order=order,
            transaction_id=txn_id,
            payment_method="cod",
            status=TransactionStatus.PENDING,
            amount=order.total_amount,
        )
        return transaction_obj

    def verify_payment(self, order, payload: dict):
        return True
