import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import {
  Printer,
  Sparkles,
  ArrowRight,
  Monitor,
  Keyboard,
  HardDrive,
  ShieldCheck,
  Star,
  Zap,
  Truck,
  Percent,
  Clock,
  Cable,
} from "lucide-react";
import CartridgeSearchWidget from "@/components/shop/CartridgeSearchWidget";
import HeroCarousel from "@/components/shop/HeroCarousel";
import CustomersLoveRastogiCartridge from "@/components/shop/CustomersLoveRastogiCartridge";
import { fetchApi } from "@/lib/api-client";
import { getImageUrl } from "@/lib/utils";

export const revalidate = 60; // ISR 60 seconds

export const metadata: Metadata = {
  title: "Rastogi Cartridge | Genuine Cartridges, Printers, Electronics & Accessories",
  description:
    "Rastogi Cartridge is your one-stop shop for OEM & compatible printer cartridges, monitors, keyboards, mice, and computer components with Cash-on-Delivery.",
  openGraph: {
    title: "Rastogi Cartridge | Genuine Cartridges, Printers & Electronics",
    description: "Shop cartridges, printers, and computer hardware with guaranteed fit.",
    type: "website",
  },
};

export default async function ShopHomePage() {
  let products: any[] = [];
  try {
    const res = await fetchApi<{ results: any[] }>("/catalog/products/");
    products = res.results || [];
  } catch {
    products = [];
  }

  return (
    <div className="bg-slate-100 dark:bg-slate-950 min-h-screen space-y-8 pb-16 select-none">

      {/* Hero Banner Carousel (Amazon / Flipkart Style) */}
      <HeroCarousel />

      {/* Featured Products Grid (Amazon / Flipkart Style) */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 space-y-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-sm">

          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Trending Marketplace Products
              </h2>
              <p className="text-xs text-slate-500">Genuine items in stock today with Cash-on-Delivery</p>
            </div>
            <Link
              href="/catalog"
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
            >
              Explore Full Catalog →
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="p-8 rounded-xl bg-slate-50 dark:bg-slate-800 text-center text-slate-400 text-xs border border-slate-200 dark:border-slate-800">
              No products available at the moment. Add products from Rastogi Admin!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.slice(0, 8).map((product: any) => (
                <Link
                  key={product.id}
                  href={`/product/${product.slug}`}
                  className="group rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-amber-400 transition-all shadow-sm hover:shadow-lg flex flex-col justify-between p-4"
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

                    {product.discount_percentage > 0 && (
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

        </div>
      </section>

      {/* Flipkart Style Deals of the Day Banner */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500 text-white font-bold animate-pulse">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Deals of the Day
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  Limited Time Only
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Handpicked accessory deals with fast Cash-on-Delivery across India
              </p>
            </div>
          </div>

          <Link
            href="/catalog?category=accessories"
            className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
          >
            View All Accessories →
          </Link>
        </div>

        {/* Accessories Deals Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">

          {/* Monitor Accessories */}
          <Link
            href="/catalog?category=monitor-accessories"
            className="group p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center hover:border-amber-400 transition-all"
          >
            <div className="w-12 h-12 mx-auto rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 mb-2 group-hover:scale-110 transition-transform">
              <Monitor className="w-6 h-6" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-500">
              Monitor Accessories
            </h3>
            <p className="text-[10px] font-bold text-emerald-600 pt-1">
              Up to 30% Off
            </p>
          </Link>

          {/* Keyboards & Mice */}
          <Link
            href="/catalog?category=keyboards"
            className="group p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center hover:border-amber-400 transition-all"
          >
            <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 mb-2 group-hover:scale-110 transition-transform">
              <Keyboard className="w-6 h-6" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-500">
              Keyboards & Mice
            </h3>
            <p className="text-[10px] font-bold text-emerald-600 pt-1">
              Under ₹999
            </p>
          </Link>

          {/* Cables & Adapters */}
          <Link
            href="/catalog?category=cables-adapters"
            className="group p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center hover:border-amber-400 transition-all"
          >
            <div className="w-12 h-12 mx-auto rounded-full bg-cyan-100 dark:bg-cyan-950 flex items-center justify-center text-cyan-600 mb-2 group-hover:scale-110 transition-transform">
              <Cable className="w-6 h-6" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-500">
              Cables & Adapters
            </h3>
            <p className="text-[10px] font-bold text-emerald-600 pt-1">
              From ₹199
            </p>
          </Link>

          {/* PC Accessories */}
          <Link
            href="/catalog?category=accessories"
            className="group p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center hover:border-amber-400 transition-all"
          >
            <div className="w-12 h-12 mx-auto rounded-full bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600 mb-2 group-hover:scale-110 transition-transform">
              <HardDrive className="w-6 h-6" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-500">
              PC Accessories
            </h3>
            <p className="text-[10px] font-bold text-emerald-600 pt-1">
              Extra 15% Off
            </p>
          </Link>

          {/* Printer Accessories */}
          <Link
            href="/catalog?category=printer-cartridges"
            className="group p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center hover:border-emerald-500 transition-all"
          >
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Printer className="w-6 h-6" />
            </div>
            <h3 className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
              Printer Accessories
            </h3>
            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 pt-1">
              Up to 40% Off
            </p>
          </Link>

        </div>

      </section>

      {/* Cartridge Finder Wizard Section */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6">
        <CartridgeSearchWidget />
      </section>

      {/* Customers Love Rastogi Cartridge Testimonial Marquee Section */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6">
        <CustomersLoveRastogiCartridge />
      </section>

    </div>
  );
}
