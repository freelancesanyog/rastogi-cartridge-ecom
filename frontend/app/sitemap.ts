import { MetadataRoute } from "next";
import { fetchApi } from "@/lib/api-client";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let staticRoutes: MetadataRoute.Sitemap = [
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
    const categoriesRes = await fetchApi<any>("/catalog/categories/");
    const categories = categoriesRes.results || categoriesRes || [];
    categoryRoutes = categories.map((cat: any) => ({
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
    const productsRes = await fetchApi<any>("/catalog/products/");
    const products = productsRes.results || productsRes || [];
    productRoutes = products.map((prod: any) => ({
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
    const devicesRes = await fetchApi<any>("/compatibility/devices/");
    const devices = devicesRes.results || devicesRes || [];
    compatibilityRoutes = devices.map((dev: any) => ({
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
