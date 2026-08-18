import { MetadataRoute } from "next";
import { fetchApi } from "@/lib/api-client";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

interface SitemapCategory {
  slug: string;
}

interface SitemapProduct {
  slug: string;
}

interface SitemapDevice {
  slug: string;
  brand?: { slug: string };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/compatibility`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  let categoryRoutes: MetadataRoute.Sitemap = [];
  try {
    const categoriesRes = await fetchApi<{ results?: SitemapCategory[] } | SitemapCategory[]>("/catalog/categories/");
    const categories = Array.isArray(categoriesRes) ? categoriesRes : categoriesRes.results || [];
    categoryRoutes = categories.map((cat: SitemapCategory) => ({
      url: `${SITE_URL}/category/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch {
    categoryRoutes = [];
  }

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const productsRes = await fetchApi<{ results?: SitemapProduct[] } | SitemapProduct[]>("/catalog/products/");
    const products = Array.isArray(productsRes) ? productsRes : productsRes.results || [];
    productRoutes = products.map((prod: SitemapProduct) => ({
      url: `${SITE_URL}/product/${prod.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    }));
  } catch {
    productRoutes = [];
  }

  let compatibilityRoutes: MetadataRoute.Sitemap = [];
  try {
    const devicesRes = await fetchApi<{ results?: SitemapDevice[] } | SitemapDevice[]>("/compatibility/devices/");
    const devices = Array.isArray(devicesRes) ? devicesRes : devicesRes.results || [];
    compatibilityRoutes = devices.map((dev: SitemapDevice) => ({
      url: `${SITE_URL}/compatibility/${dev.brand?.slug || "printer"}/${dev.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch {
    compatibilityRoutes = [];
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes, ...compatibilityRoutes];
}
