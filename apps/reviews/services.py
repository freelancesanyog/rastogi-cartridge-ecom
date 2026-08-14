import logging

from apps.catalog.models import Product
from apps.reviews.models import ProductReview

logger = logging.getLogger(__name__)


class ReviewService:
    """
    Domain service for managing customer product reviews and moderation.
    """

    @staticmethod
    def create_review(user, product: Product, rating: int, comment: str) -> ProductReview:
        """
        Creates or updates a product review submitted by a verified customer.
        Auto-approves reviews so they appear immediately on product pages and in Admin.
        """
        review, created = ProductReview.objects.update_or_create(
            user=user,
            product=product,
            defaults={
                "rating": rating,
                "comment": comment,
                "is_approved": True,
            },
        )
        logger.info("Product review created/updated for %s by %s.", product.sku, user.email)
        return review

    @staticmethod
    def get_approved_product_reviews(product_identifier):
        """
        Returns public queryset of approved reviews for a given product ID or slug.
        """
        if isinstance(product_identifier, Product):
            product = product_identifier
        elif isinstance(product_identifier, int):
            product = Product.objects.filter(pk=product_identifier).first()
        else:
            product = Product.objects.filter(slug=product_identifier).first()

        if not product:
            return ProductReview.objects.none()

        return ProductReview.objects.filter(product=product, is_approved=True).select_related(
            "user", "product"
        )
