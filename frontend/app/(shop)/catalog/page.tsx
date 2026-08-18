import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Printer, ChevronRight, Star, Truck } from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { generateBreadcrumbJsonLd } from "@/lib/seo";
import { getImageUrl } from "@/lib/utils";

export const revalidate = 60; // ISR 60 seconds

interface CatalogPageProps {
  searchParams: Promise<{ [key: string]: string | undefined }> | { [key: string]: string | undefined };
}

export async function generateMetadata({ searchParams }: CatalogPageProps): Promise<Metadata> {
  const params = await searchParams;
  const categoryName = params?.category
    ? params.category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "All Products";

  return {
    title: `${categoryName} | Rastogi Cartridge Online Store`,
    description: `Shop genuine ${categoryName} with Cash-on-Delivery at Rastogi Cartridge.`,
    openGraph: {
      title: `${categoryName} | Rastogi Cartridge`,
      description: `Explore our collection of ${categoryName}.`,
    },
  };
}

interface CatalogCategory {
  id: number;
  name: string;
  slug: string;
  meta_description?: string;
}

interface CatalogProduct {
  id: number;
  name: string;
  slug: string;
  sku: string;
  price: string;
  mrp?: string;
  brand?: { name: string; slug: string };
  primary_image?: { image?: string } | null;
  discount_percentage?: number;
  stock_status?: {
    in_stock: boolean;
  };
}

interface ProductsResponse {
  results: CatalogProduct[];
  count: number;
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = await searchParams;
  let productsRes: ProductsResponse = { results: [], count: 0 };
  let categories: CatalogCategory[] = [];
  let currentCategory: CatalogCategory | null = null;

  try {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.set("category", params.category);
    if (params?.brand) queryParams.set("brand", params.brand);
    if (params?.min_price) queryParams.set("min_price", params.min_price);
    if (params?.max_price) queryParams.set("max_price", params.max_price);
    if (params?.cartridge_type) queryParams.set("cartridge_type", params.cartridge_type);
    if (params?.in_stock) queryParams.set("in_stock", params.in_stock);
    if (params?.q) queryParams.set("search", params.q);
    if (params?.page) queryParams.set("page", params.page);

    const [prodData, catData] = await Promise.all([
      fetchApi<ProductsResponse | CatalogProduct[]>(`/catalog/products/?${queryParams.toString()}`),
      fetchApi<{ results?: CatalogCategory[] } | CatalogCategory[]>("/catalog/categories/"),
    ]);

    if (Array.isArray(prodData)) {
      productsRes = { results: prodData, count: prodData.length };
    } else if (prodData) {
      productsRes = prodData;
    }

    categories = Array.isArray(catData) ? catData : catData?.results || [];

    if (params?.category) {
      currentCategory = categories.find((c) => c.slug === params.category) || null;
    }
  } catch {
    productsRes = { results: [], count: 0 };
  };

  const titleText = currentCategory
    ? currentCategory.name
    : params?.category
      ? params.category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "All Products";

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Catalog", url: "/catalog" },
    ...(params?.category
      ? [{ name: titleText, url: `/catalog?category=${params.category}` }]
      : []),
  ];

  const jsonLd = generateBreadcrumbJsonLd(breadcrumbs);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="bg-slate-100 dark:bg-slate-950 min-h-screen py-6 select-none">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 space-y-6">

          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs text-slate-400 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            {breadcrumbs.map((item, idx) => (
              <div key={item.url} className="flex items-center gap-2">
                {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-500" />}
                <Link href={item.url} className="hover:text-amber-600 font-medium transition-colors">
                  {item.name}
                </Link>
              </div>
            ))}
          </nav>

          {/* Page Header */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {titleText}
              </h1>
              <span className="text-xs font-bold text-slate-600 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                {productsRes.count || productsRes.results.length} Products Found
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-3xl">
              {currentCategory?.meta_description ||
                `Browse genuine products at Rastogi Cartridge with guaranteed fit, best prices, and Cash-on-Delivery.`}
            </p>

            {/* Quick Category Filter Chips */}
            {categories?.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-3">
                <Link
                  href="/catalog"
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${!params?.category
                    ? "bg-amber-400 text-slate-950 shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                >
                  All Categories
                </Link>
                {categories.map((cat: CatalogCategory) => (
                  <Link
                    key={cat.id}
                    href={`/catalog?category=${cat.slug}`}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${params?.category === cat.slug
                      ? "bg-amber-400 text-slate-950 shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                      }`}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Full Width Product Grid */}
          <main className="w-full space-y-4">
            <div className="bg-white dark:bg-slate-900 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>
                Showing {productsRes.results.length} of {productsRes.count || productsRes.results.length} results
              </span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">Rastogi Assured Delivery</span>
            </div>

            {productsRes.results.length === 0 ? (
              <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 text-center space-y-4 border border-slate-200 dark:border-slate-800">
                <Printer className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  No matching products found
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  We couldn&apos;t find any products in this category. Browse all catalog items.
                </p>
                <Link
                  href="/catalog"
                  className="inline-block px-4 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-bold hover:bg-amber-500 transition-colors"
                >
                  View All Products
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {productsRes.results.map((product: CatalogProduct) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug}`}
                    className="group rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-amber-400 transition-all shadow-sm hover:shadow-xl flex flex-col justify-between p-4"
                  >
                    <div className="relative aspect-square w-full bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 flex items-center justify-center mb-3">
                      {product.primary_image?.image ? (
                        <Image
                          src={getImageUrl(product.primary_image.image)}
                          alt={product.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 25vw"
                          className="object-contain p-3 group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <Printer className="w-12 h-12 text-slate-300 dark:text-slate-700" />
                      )}

                      {!!product.discount_percentage && product.discount_percentage > 0 && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-black">
                          {product.discount_percentage}% OFF
                        </span>
                      )}

                      {product.stock_status?.in_stock && (
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[10px] font-bold border border-emerald-500/20">
                          In Stock
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {product.brand?.name || "Rastogi Assured"}
                        </span>
                        <div className="flex items-center text-amber-400 text-[11px] font-bold">
                          <Star className="w-3 h-3 fill-amber-400 mr-0.5" />
                          <span>4.4</span>
                        </div>
                      </div>

                      <h3 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-2 group-hover:text-amber-600 transition-colors">
                        {product.name}
                      </h3>

                      <div className="flex items-baseline gap-2 pt-1">
                        <span className="text-base font-black text-slate-900 dark:text-white">
                          ₹{product.price}
                        </span>
                        {product.mrp && parseFloat(product.mrp) > parseFloat(product.price) && (
                          <span className="text-xs text-slate-400 line-through">
                            ₹{product.mrp}
                          </span>
                        )}
                      </div>

                      <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 pt-1">
                        <Truck className="w-3 h-3" />
                        <span>Free Delivery by Tomorrow</span>
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </main>

        </div>
      </div>
    </>
  );
}
