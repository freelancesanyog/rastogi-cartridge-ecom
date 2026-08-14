from apps.payments.gateways.cod import CODGateway


class PaymentGatewayFactory:
    """
    Factory to instantiate payment gateway handlers based on requested payment method.
    """

    _gateways = {
        "cod": CODGateway,
    }

    @classmethod
    def register_gateway(cls, method_name: str, gateway_cls):
        """
        Allows registering new payment gateway implementations dynamically.
        """
        cls._gateways[method_name.lower()] = gateway_cls

    @classmethod
    def get_gateway(cls, method_name: str):
        """
        Returns an instance of requested payment gateway.
        """
        gateway_cls = cls._gateways.get(method_name.lower())
        if not gateway_cls:
            raise ValueError(f"Unsupported payment method: '{method_name}'")
        return gateway_cls()
