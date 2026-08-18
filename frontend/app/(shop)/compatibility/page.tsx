import { Metadata } from "next";
import { Printer, Sparkles } from "lucide-react";
import CartridgeSearchWidget from "@/components/shop/CartridgeSearchWidget";
import { fetchApi } from "@/lib/api-client";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Printer Cartridge Finder & Compatibility Matrix | Rastogi Cartridge",
  description: "Find exact fitting cartridges for HP, Canon, Epson, Brother, and Dell printers.",
};

interface BrandItem {
  id: number;
  name: string;
  slug: string;
}

export default async function CompatibilityIndexPage() {
  let brands: BrandItem[] = [];
  try {
    const res = await fetchApi<{ results?: BrandItem[] } | BrandItem[]>("/compatibility/brands/");
    brands = Array.isArray(res) ? res : res.results || [];
  } catch {
    brands = [];
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Header Banner */}
      <div className="space-y-4 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
          <Sparkles className="w-4 h-4" />
          <span>Printer Cartridge Finder</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Select Your Printer to Find Fitting Cartridges
        </h1>
        <p className="text-sm text-slate-500">
          Guaranteed fitting original OEM & compatible toner and ink cartridges.
        </p>
      </div>

      {/* Interactive Finder Wizard */}
      <CartridgeSearchWidget />

      {/* Browse by Printer Brand */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Browse by Printer Brand</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {brands.map((brand: BrandItem) => (
            <div
              key={brand.id}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2"
            >
              <Printer className="w-8 h-8 mx-auto text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">{brand.name}</h3>
              <p className="text-xs text-slate-400">Guaranteed Fit Cartridges</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
