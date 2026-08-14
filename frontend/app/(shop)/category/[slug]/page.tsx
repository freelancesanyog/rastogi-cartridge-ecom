import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Printer, ChevronRight, Loader2 } from "lucide-react";
import CategoryFilterBar from "@/components/shop/CategoryFilterBar";
import { fetchApi } from "@/lib/api-client";
import { generateBreadcrumbJsonLd } from "@/lib/seo";

export const revalidate = 60; // ISR 60 seconds

interface CategoryPageProps {
  params: Promise<{ slug: string }> | { slug: string };
  searchParams: Promise<{ [key: string]: string | undefined }> | { [key: string]: string | undefined };
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const p = await params;
  try {
    const category = await fetchApi<any>(`/catalog/categories/${p.slug}/`);
    return {
      title: category.meta_title || `${category.name} | Rastogi Cartridge`,
      description: category.meta_description || `Buy ${category.name} online with Cash-on-Delivery at Rastogi Cartridge.`,
      openGraph: {
        title: category.meta_title || category.name,
        description: category.meta_description || `Shop ${category.name}`,
      },
    };
  } catch {
    return {
      title: "Category Products | Rastogi Cartridge",
    };
  }
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const p = await params;
  const s = await searchParams;
  let category: any = null;
  let productsRes: any = { results: [], count: 0 };
  let brands: any[] = [];

  try {
    category = await fetchApi<any>(`/catalog/categories/${p.slug}/`);
  } catch {
    notFound();
  }

  try {
    const queryParams = new URLSearchParams();
    queryParams.set("category", p.slug);

    if (s?.brand) queryParams.set("brand", s.brand);
    if (s?.min_price) queryParams.set("min_price", s.min_price);
    if (s?.max_price) queryParams.set("max_price", s.max_price);
    if (s?.cartridge_type) queryParams.set("cartridge_type", s.cartridge_type);
    if (s?.in_stock) queryParams.set("in_stock", s.in_stock);
    if (s?.page) queryParams.set("page", s.page);

    productsRes = await fetchApi<any>(`/catalog/products/?${queryParams.toString()}`);
    const brandsRes = await fetchApi<any>("/catalog/brands/");
    brands = brandsRes.results || [];
  } catch {
    productsRes = { results: [], count: 0 };
  }

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Categories", url: "/catalog" },
    { name: category.name, url: `/category/${category.slug}` },
  ];

  const jsonLd = generateBreadcrumbJsonLd(breadcrumbs);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-400">
          {breadcrumbs.map((item, idx) => (
            <div key={item.url} className="flex items-center gap-2">
              {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-500" />}
              <Link href={item.url} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                {item.name}
              </Link>
            </div>
          ))}
        </nav>

        {/* Category Header */}
        <div className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-6">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {category.name}
          </h1>
          {category.meta_description && (
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-3xl">
              {category.meta_description}
            </p>
          )}
        </div>

        {/* Layout Grid: Filters Sidebar + Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Filters Column */}
          <aside className="lg:col-span-1">
            <Suspense fallback={<div className="p-4 text-xs text-slate-400"><Loader2 className="w-4 h-4 animate-spin" /></div>}>
              <CategoryFilterBar brands={brands} />
            </Suspense>
          </aside>

          {/* Product Grid Column */}
          <main className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Showing {productsRes.results.length} of {productsRes.count} products</span>
            </div>

            {productsRes.results.length === 0 ? (
              <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 text-center text-slate-400 text-sm border border-slate-200 dark:border-slate-800">
                No products match the selected filters in this category.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {productsRes.results.map((product: any) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug}`}
                    className="group rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-indigo-500 transition-all shadow-sm hover:shadow-xl flex flex-col justify-between"
                  >
                    <div className="relative aspect-square w-full bg-slate-50 dark:bg-slate-800/50 p-4 flex items-center justify-center">
                      {product.primary_image?.image ? (
                        <Image
                          src={product.primary_image.image}
                          alt={product.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-contain p-4 group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <Printer className="w-12 h-12 text-slate-300 dark:text-slate-700" />
                      )}
                      {product.stock_status?.in_stock && (
                        <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                          In Stock
                        </span>
                      )}
                    </div>

                    <div className="p-5 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {product.brand?.name || "Generic"}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                          ${product.price}
                        </span>
                        {product.mrp && parseFloat(product.mrp) > parseFloat(product.price) && (
                          <span className="text-xs text-slate-400 line-through">
                            ${product.mrp}
                          </span>
                        )}
                      </div>
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
