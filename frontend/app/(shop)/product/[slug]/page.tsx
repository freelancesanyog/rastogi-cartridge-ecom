import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  ShieldCheck,
  Truck,
  RefreshCw,
  Star,
  CheckCircle,
  AlertCircle,
  Sparkles,
  MapPin,
  Clock,
} from "lucide-react";
import ProductDetailView from "@/components/shop/ProductDetailView";
import { fetchApi } from "@/lib/api-client";
import { generateBreadcrumbJsonLd, generateProductJsonLd } from "@/lib/seo";

export const revalidate = 60; // ISR 60 seconds

interface ProductPageProps {
  params: Promise<{ slug: string }> | { slug: string };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const p = await params;
  try {
    const product = await fetchApi<any>(`/catalog/products/${p.slug}/`);
    return {
      title: product.meta_title || `${product.name} | Rastogi Cartridge Store`,
      description: product.meta_description || product.description || `Buy ${product.name} online with Cash-on-Delivery at Rastogi Cartridge.`,
      openGraph: {
        title: product.meta_title || product.name,
        description: product.meta_description || product.description,
        images: product.primary_image?.image ? [{ url: product.primary_image.image }] : [],
      },
    };
  } catch {
    return {
      title: "Product Details | Rastogi Cartridge",
    };
  }
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const p = await params;
  let product: any = null;
  let reviews: any[] = [];
  let compatibleDevices: any[] = [];

  try {
    product = await fetchApi<any>(`/catalog/products/${p.slug}/`);
  } catch {
    notFound();
  }

  try {
    const reviewsRes = await fetchApi<any>(`/reviews/?product=${product.id}`);
    reviews = reviewsRes.results || [];
  } catch {
    reviews = [];
  }

  // Fetch compatible devices if category requires compatibility mapping
  if (product.category?.requires_compatibility_mapping) {
    try {
      const devicesRes = await fetchApi<any>(`/compatibility/devices/?product=${product.id}`);
      compatibleDevices = devicesRes.results || [];
    } catch {
      compatibleDevices = [];
    }
  }

  const breadcrumbs = [
    { name: "Home", url: "/" },
    {
      name: product.category?.name || "Products",
      url: product.category ? `/catalog?category=${product.category.slug}` : "/catalog",
    },
    { name: product.name, url: `/product/${product.slug}` },
  ];

  const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbs);
  const productJsonLd = generateProductJsonLd(product, reviews);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      <div className="bg-slate-100 dark:bg-slate-950 min-h-screen py-6 select-none">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 space-y-6">

          {/* Breadcrumb */}
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

          {/* Main Product Layout with Synchronized Dynamic Variant State */}
          <ProductDetailView product={product} />

          {/* Compatible Printer Models Section */}
          {product.category?.requires_compatibility_mapping && compatibleDevices.length > 0 && (
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-500" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Guaranteed Fitting Printer Models
                </h2>
              </div>
              <p className="text-xs text-slate-500">This cartridge from Rastogi Cartridge is verified to fit the following printer models:</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                {compatibleDevices.map((dev: any) => (
                  <Link
                    key={dev.id}
                    href={`/compatibility/${dev.brand?.slug}/${dev.slug}`}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-amber-600 hover:border-amber-400 transition-all"
                  >
                    {dev.brand?.name} {dev.model_name} {dev.model_number ? `(${dev.model_number})` : ""}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Approved Customer Reviews Section */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Customer Reviews ({reviews.length})
              </h2>
            </div>

            {reviews.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No reviews yet for this product. Be the first to leave feedback after purchase!</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev: any) => (
                  <div key={rev.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{rev.user_email}</span>
                      <div className="flex items-center text-amber-400 text-xs gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span className="font-bold text-slate-700 dark:text-slate-300">{rev.rating}/5</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </>
  );
}
