"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api-client";

interface Brand {
  id: number;
  name: string;
  slug: string;
}

interface DeviceModel {
  id: number;
  model_name: string;
  model_number: string;
  slug: string;
}

export default function CartridgeSearchWidget() {
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandSlug, setSelectedBrandSlug] = useState<string>("");
  const [models, setModels] = useState<DeviceModel[]>([]);
  const [selectedModelSlug, setSelectedModelSlug] = useState<string>("");
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
    async function loadBrands() {
      setLoadingBrands(true);
      try {
        const res = await fetchApi<{ results: Brand[] }>("/compatibility/brands/");
        setBrands(res.results || []);
      } catch {
        // Fallback demo brands
      } finally {
        setLoadingBrands(false);
      }
    }
    loadBrands();
  }, []);

  useEffect(() => {
    if (!selectedBrandSlug) {
      return;
    }

    let isMounted = true;
    async function loadModels() {
      setLoadingModels(true);
      try {
        const res = await fetchApi<{ results?: DeviceModel[] } | DeviceModel[]>(
          `/compatibility/devices/?brand=${selectedBrandSlug}`
        );
        const list = Array.isArray(res) ? res : res?.results || [];
        if (isMounted) {
          setModels(list);
        }
      } catch {
        if (isMounted) setModels([]);
      } finally {
        if (isMounted) setLoadingModels(false);
      }
    }
    loadModels();
    return () => {
      isMounted = false;
    };
  }, [selectedBrandSlug]);

  const handleBrandSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const slug = e.target.value;
    setSelectedBrandSlug(slug);
    setSelectedModelSlug("");
    if (!slug) {
      setModels([]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBrandSlug && selectedModelSlug) {
      router.push(`/compatibility/${selectedBrandSlug}/${selectedModelSlug}`);
    }
  };

  return (
    <div className="w-full glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl space-y-4">

      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            Find Compatible Cartridges for Your Printer
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select your printer brand & model to see guaranteed fitting cartridges
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">

        {/* Brand Dropdown */}
        <div className="relative">
          <select
            value={selectedBrandSlug}
            onChange={handleBrandSelectChange}
            disabled={loadingBrands}
            className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all appearance-none cursor-pointer"
          >
            <option value="">Select Printer Brand</option>
            {brands.map((b) => (
              <option key={b.id} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>
          {loadingBrands && (
            <Loader2 className="absolute right-3.5 top-3.5 w-4 h-4 animate-spin text-slate-400" />
          )}
        </div>

        {/* Model Dropdown */}
        <div className="relative">
          <select
            value={selectedModelSlug}
            onChange={(e) => setSelectedModelSlug(e.target.value)}
            disabled={!selectedBrandSlug || loadingModels}
            className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all appearance-none cursor-pointer disabled:opacity-50"
          >
            <option value="">
              {!selectedBrandSlug ? "Select Brand First" : "Select Printer Model"}
            </option>
            {models.map((m) => (
              <option key={m.id} value={m.slug}>
                {m.model_name} {m.model_number ? `(${m.model_number})` : ""}
              </option>
            ))}
          </select>
          {loadingModels && (
            <Loader2 className="absolute right-3.5 top-3.5 w-4 h-4 animate-spin text-slate-400" />
          )}
        </div>

        {/* Search Button */}
        <button
          type="submit"
          disabled={!selectedBrandSlug || !selectedModelSlug}
          className="w-full py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Search className="w-4 h-4" />
          <span>Find Cartridges</span>
        </button>

      </form>

    </div>
  );
}
