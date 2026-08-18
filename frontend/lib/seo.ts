const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function generateOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Rastogi Cartridge",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+1-800-555-7746",
      contactType: "customer service",
      areaServed: "US",
      availableLanguage: "en",
    },
  };
}

export function generateBreadcrumbJsonLd(breadcrumbs: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

export interface SeoProduct {
  name: string;
  slug: string;
  price: number | string;
  sku?: string;
  description?: string;
  meta_description?: string;
  stock_status?: { in_stock?: boolean } | null;
  primary_image?: { image: string } | null;
  images?: { image: string }[] | null;
  brand?: { name: string } | null;
}

export interface SeoReview {
  rating: number;
}

export function generateProductJsonLd(product: SeoProduct, reviews: SeoReview[] = []) {
  const isAvailable = product.stock_status?.in_stock ?? true;
  const ratingCount = reviews.length;
  const avgRating =
    ratingCount > 0
      ? (reviews.reduce((acc: number, r: SeoReview) => acc + r.rating, 0) / ratingCount).toFixed(1)
      : null;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.primary_image?.image || product.images?.[0]?.image || [],
    description: product.description || product.meta_description || product.name,
    sku: product.sku,
    brand: {
      "@type": "Brand",
      name: product.brand?.name || "Rastogi Cartridge",
    },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/product/${product.slug}`,
      priceCurrency: "USD",
      price: product.price,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      itemCondition: "https://schema.org/NewCondition",
      availability: isAvailable
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  if (avgRating && ratingCount > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: avgRating,
      reviewCount: ratingCount,
    };
  }

  return schema;
}
