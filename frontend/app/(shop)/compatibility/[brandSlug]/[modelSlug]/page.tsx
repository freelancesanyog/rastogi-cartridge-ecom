import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Printer, ChevronRight, CheckCircle } from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { generateBreadcrumbJsonLd } from "@/lib/seo";
import { getImageUrl } from "@/lib/utils";

export const revalidate = 60; // ISR 60 seconds

interface CompatibilityResultProps {
  params: Promise<{ brandSlug: string; modelSlug: string }> | { brandSlug: string; modelSlug: string };
}

interface DeviceDetail {
  id?: number;
  model_name?: string;
  model_number?: string;
  slug?: string;
  brand?: { name: string; slug: string };
}

interface CompatibleProduct {
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

export async function generateMetadata({ params }: CompatibilityResultProps): Promise<Metadata> {
  const resolvedParams = await params;
  try {
    const device = await fetchApi<DeviceDetail>(`/compatibility/devices/${resolvedParams.modelSlug}/`);
    return {
      title: `Compatible Cartridges for ${device.brand?.name || ""} ${device.model_name || ""} | Rastogi Cartridge`,
      description: `Shop guaranteed compatible ink & toner cartridges for ${device.brand?.name || ""} ${device.model_name || ""} ${device.model_number || ""}.`,
    };
  } catch {
    return {
      title: "Compatible Cartridge Results | Rastogi Cartridge",
    };
  }
}

export default async function CompatibilityResultPage({ params }: CompatibilityResultProps) {
  const resolvedParams = await params;
  const { brandSlug, modelSlug } = resolvedParams;

  let device: DeviceDetail | null = null;
  let products: CompatibleProduct[] = [];

  try {
    // 1. Fetch Device Model Details
    try {
      device = await fetchApi<DeviceDetail>(`/compatibility/devices/${modelSlug}/`);
    } catch {
      // Fallback: search devices list for model matching slug
      const listRes = await fetchApi<{ results?: DeviceDetail[] } | DeviceDetail[]>(`/compatibility/devices/?brand=${brandSlug}`);
      const list = Array.isArray(listRes) ? listRes : listRes.results || [];
      device = list.find((m: DeviceDetail) => m.slug === modelSlug || m.id?.toString() === modelSlug) || null;
    }

    if (!device) {
      return notFound();
    }

    // 2. Fetch Compatible Products
    const productsRes = await fetchApi<{ results?: CompatibleProduct[] } | CompatibleProduct[]>(`/compatibility/devices/${device.slug || modelSlug}/products/`);
    products = Array.isArray(productsRes) ? productsRes : productsRes.results || [];
  } catch {
    return notFound();
  }

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Cartridge Finder", url: "/compatibility" },
    {
      name: `${device.brand?.name || brandSlug} ${device.model_name || modelSlug}`,
      url: `/compatibility/${brandSlug}/${modelSlug}`,
    },
  ];

  const jsonLd = generateBreadcrumbJsonLd(breadcrumbs);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 select-none">

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

        {/* Hero Result Banner */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border border-slate-800 space-y-3 shadow-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
            <CheckCircle className="w-4 h-4" />
            <span>Guaranteed Fit Verified</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Cartridges Compatible with {device.brand?.name || ""} {device.model_name}{" "}
            {device.model_number ? `(${device.model_number})` : ""}
          </h1>
          <p className="text-xs text-slate-300">
            Showing all OEM original & verified third-party compatible cartridges in stock for this printer model.
          </p>
        </div>

        {/* Compatible Products Grid */}
        {products.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 text-center space-y-3 border border-slate-200 dark:border-slate-800">
            <Printer className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              No active compatible cartridges found
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              We couldn&apos;t find specific cartridges mapped to {device.model_name} right now. Browse our complete catalog for general cartridges.
            </p>
            <Link
              href="/catalog"
              className="inline-block px-4 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-bold hover:bg-amber-500 transition-colors"
            >
              Browse All Catalog Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product: CompatibleProduct) => (
              <Link
                key={product.id}
                href={`/product/${product.slug}`}
                className="group rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-amber-400 transition-all shadow-sm hover:shadow-xl flex flex-col justify-between p-4"
              >
                <div className="relative aspect-square w-full bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 flex items-center justify-center mb-3">
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
                  {product.stock_status?.in_stock && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                      In Stock
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {product.brand?.name || "Rastogi Assured"}
                  </span>
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
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </>
  );
}
