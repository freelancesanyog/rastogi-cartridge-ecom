from abc import ABC, abstractmethod


class BasePaymentGateway(ABC):
    """
    Abstract Payment Gateway Interface.
    Decouples core order processing from specific payment providers (COD, Razorpay, etc.).
    """

    @abstractmethod
    def process_payment(self, order):
        """
        Processes initial payment registration for an order.
        Returns a PaymentTransaction instance or payment payload.
        """
        pass

    @abstractmethod
    def verify_payment(self, order, payload: dict):
        """
        Verifies payment signature / callback confirmation from gateway.
        """
        pass
