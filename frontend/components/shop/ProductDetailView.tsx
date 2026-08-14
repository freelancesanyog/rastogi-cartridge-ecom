"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Star,
  CheckCircle,
  AlertCircle,
  Truck,
  ShieldCheck,
  MapPin,
  Layers,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import ProductImageGallery from "@/components/shop/ProductImageGallery";
import AddToCartButton from "@/components/shop/AddToCartButton";

interface ProductVariant {
  id: number;
  sku: string;
  attributes: Record<string, any>;
  price_override: string | null;
  effective_price: string;
  stock: number;
  stock_status: {
    in_stock: boolean;
    status: string;
    available_quantity: number;
    is_low_stock: boolean;
  };
}

interface ProductDetailViewProps {
  product: {
    id: number;
    sku: string;
    name: string;
    slug: string;
    brand?: { name: string; slug: string };
    category?: { name: string; slug: string };
    description?: string;
    price: string;
    mrp?: string;
    specifications?: Record<string, any>;
    images?: any[];
    primary_image?: any;
    variants?: ProductVariant[];
    discount_percentage?: number;
    stock_status: {
      in_stock: boolean;
      status: string;
      available_quantity: number;
      is_low_stock: boolean;
    };
  };
}

const renderSpecValue = (val: any): string => {
  if (val === null || val === undefined) return "";
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (typeof val !== "object") return String(val);

  if (Array.isArray(val)) {
    return val
      .map((item) => {
        if (typeof item === "object" && item !== null) {
          const parts: string[] = [];
          if (item.type) parts.push(String(item.type));
          if (item.name && item.name !== item.type) parts.push(String(item.name));
          if (item.capacity) parts.push(`(${item.capacity})`);
          if (item.quantity && item.quantity > 1) parts.push(`x${item.quantity}`);

          if (parts.length > 0) return parts.join(" ");
          return Object.values(item).map(String).join(" ");
        }
        return String(item);
      })
      .filter(Boolean)
      .join(", ");
  }

  const entries = Object.entries(val);
  return entries
    .map(([k, v]) => {
      const vStr = typeof v === "object" ? renderSpecValue(v) : String(v);
      return `${k.replace(/_/g, " ")}: ${vStr}`;
    })
    .join(" | ");
};

import { useLiveStock } from "@/hooks/useLiveStock";

export default function ProductDetailView({ product }: ProductDetailViewProps) {
  const variants = product.variants || [];
  const hasVariants = variants.length > 0;

  // Live stock HTTP polling (4s loop, paused when tab hidden)
  const { liveStock } = useLiveStock(product.slug);

  // Dynamic live viewer count (fluctuates dynamically between 18 and 45)
  const [viewerCount, setViewerCount] = useState<number>(27);

  useEffect(() => {
    const initial = Math.floor(Math.random() * (36 - 22 + 1)) + 22;
    setViewerCount(initial);

    let timer: NodeJS.Timeout;

    const scheduleNextUpdate = () => {
      const delay = Math.floor(Math.random() * 3000) + 3500;
      timer = setTimeout(() => {
        setViewerCount((prev) => {
          const deltas = [-3, -2, -1, 1, 2, 3];
          const delta = deltas[Math.floor(Math.random() * deltas.length)];
          let next = prev + delta;
          if (next < 18) next = 18 + Math.floor(Math.random() * 3);
          if (next > 45) next = 45 - Math.floor(Math.random() * 3);
          return next;
        });
        scheduleNextUpdate();
      }, delay);
    };

    scheduleNextUpdate();

    return () => clearTimeout(timer);
  }, []);

  // null represents the main product added from Django Admin
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [isSpecsExpanded, setIsSpecsExpanded] = useState(false);

  // Active Dynamic State
  const activePrice = selectedVariant ? selectedVariant.effective_price : product.price;
  const activeSku = selectedVariant ? selectedVariant.sku : product.sku;

  // Live stock calculation per active selection
  const activeVariantStockInfo = selectedVariant && liveStock?.variants
    ? liveStock.variants[String(selectedVariant.id)]
    : null;
  const activeProductStockInfo = liveStock?.product;

  const availableQty = selectedVariant
    ? (activeVariantStockInfo ? activeVariantStockInfo.available_quantity : (selectedVariant.stock_status?.available_quantity ?? selectedVariant.stock ?? 0))
    : (activeProductStockInfo ? activeProductStockInfo.available_quantity : (product.stock_status?.available_quantity ?? 0));

  const isLowStock = selectedVariant
    ? (activeVariantStockInfo ? activeVariantStockInfo.low_stock : (selectedVariant.stock_status?.is_low_stock ?? false))
    : (activeProductStockInfo ? activeProductStockInfo.low_stock : (product.stock_status?.is_low_stock ?? false));

  const isInStock = selectedVariant
    ? (activeVariantStockInfo ? activeVariantStockInfo.in_stock : (selectedVariant.stock_status?.in_stock ?? availableQty > 0))
    : (activeProductStockInfo ? activeProductStockInfo.in_stock : (product.stock_status?.in_stock ?? availableQty > 0));

  // Dynamic MRP & Discount calculation
  const mrpVal = product.mrp ? parseFloat(product.mrp) : 0;
  const priceVal = parseFloat(activePrice);
  const activeDiscountPercentage =
    mrpVal > priceVal ? Math.round(((mrpVal - priceVal) / mrpVal) * 100) : 0;

  const formatVariantLabel = (v: ProductVariant) => {
    if (v.attributes && Object.keys(v.attributes).length > 0) {
      return Object.values(v.attributes)
        .map((attr) => renderSpecValue(attr))
        .join(" / ");
    }
    return v.sku;
  };

  const baseProductStock = activeProductStockInfo
    ? activeProductStockInfo.available_quantity
    : (product.stock_status?.available_quantity ?? 0);
  const isBaseOutOfStock = baseProductStock === 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">

      {/* Column 1: Image Gallery */}
      <div className="lg:col-span-1">
        <ProductImageGallery
          images={product.images || []}
          primaryImage={product.primary_image}
          productName={product.name}
        />
      </div>

      {/* Column 2: Main Product Details, Price, Stock & Specs */}
      <div className="lg:col-span-1 space-y-5 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 lg:pr-6">

        {/* Brand & Title Header */}
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Brand: {product.brand?.name || "Rastogi Assured"}
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {product.name}
          </h1>
          <div className="flex items-center gap-2 pt-1 text-xs">
            <div className="flex items-center text-amber-400 font-bold">
              <Star className="w-4 h-4 fill-amber-400" />
              <span className="ml-1 text-slate-800 dark:text-slate-200">4.4</span>
            </div>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-mono">SKU: {activeSku}</span>
          </div>
        </div>

        {/* Main Price & Stock Status Banner */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-slate-900 dark:text-white">
                ₹{activePrice}
              </span>
              {mrpVal > priceVal && (
                <span className="text-[10px] text-slate-400 line-through">
                  M.R.P.: ₹{product.mrp}
                </span>
              )}
              {activeDiscountPercentage > 0 && (
                <span className="inline-flex items-center whitespace-nowrap text-[10px] sm:text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 px-2 py-1 rounded-md border border-rose-200 dark:border-rose-800">
                  Save {activeDiscountPercentage}%
                </span>
              )}
            </div>

            {/* Dynamic Stock Status Badge & Live Viewer Count inside Main Banner */}
            <div className="flex items-center gap-2 flex-wrap">
              {availableQty > 0 ? (
                isLowStock ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-800">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Low Stock ({availableQty} left)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-800">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>In Stock ({availableQty} available)</span>
                  </span>
                )
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-lg border border-rose-300 dark:border-rose-800">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Out of Stock</span>
                </span>
              )}

              {/* Live Viewer Count Badge */}
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700/80 shadow-2xs">
                <span className="select-none animate-pulse animate-ping">⚡</span>
                <span>
                  <strong className="font-bold text-slate-900 dark:text-white transition-all duration-300">{viewerCount}</strong> people are viewing this right now!
                </span>
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500">Inclusive of all taxes</p>
        </div>

        {/* Selected Variant Attributes / Product Specifications with Expandable See More */}
        {selectedVariant && selectedVariant.attributes && Object.keys(selectedVariant.attributes).length > 0 ? (
          <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                Selected Variant Specs
              </h4>
              {Object.keys(selectedVariant.attributes).length > 4 && (
                <button
                  type="button"
                  onClick={() => setIsSpecsExpanded(!isSpecsExpanded)}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <span>{isSpecsExpanded ? "See Less" : "See More..."}</span>
                  {isSpecsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>

            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs transition-all relative ${!isSpecsExpanded && Object.keys(selectedVariant.attributes).length > 4 ? "max-h-36 overflow-hidden" : ""}`}>
              {Object.entries(selectedVariant.attributes).map(([key, val]) => (
                <div key={key} className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                    {key.replace(/_/g, " ")}
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {renderSpecValue(val)}
                  </span>
                </div>
              ))}
              {!isSpecsExpanded && Object.keys(selectedVariant.attributes).length > 4 && (
                <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-indigo-50/90 dark:from-indigo-950/90 to-transparent pointer-events-none" />
              )}
            </div>
          </div>
        ) : (
          product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate pr-2">
                  {product.name} Specifications
                </h4>
                {Object.keys(product.specifications).length > 4 && (
                  <button
                    type="button"
                    onClick={() => setIsSpecsExpanded(!isSpecsExpanded)}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 shrink-0"
                  >
                    <span>{isSpecsExpanded ? "See Less" : "See More..."}</span>
                    {isSpecsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>

              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs transition-all relative ${!isSpecsExpanded && Object.keys(product.specifications).length > 4 ? "max-h-36 overflow-hidden" : ""}`}>
                {Object.entries(product.specifications).map(([key, val]) => (
                  <div key={key} className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      {key.replace(/_/g, " ")}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 leading-snug">
                      {renderSpecValue(val)}
                    </span>
                  </div>
                ))}
                {!isSpecsExpanded && Object.keys(product.specifications).length > 4 && (
                  <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-50 dark:from-slate-800/90 to-transparent pointer-events-none" />
                )}
              </div>
            </div>
          )
        )}

        {/* Product Highlights & Description */}
        <div className="space-y-2 pt-1">
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Product Highlights</h3>
          {product.description ? (
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {product.description}
            </p>
          ) : (
            <p className="text-xs text-slate-400 italic">High quality commercial grade component from Rastogi Cartridge.</p>
          )}
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
            <Truck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="font-semibold text-[11px]">Free Fast Delivery</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
            <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="font-semibold text-[11px]">Cash on Delivery</span>
          </div>
        </div>

      </div>

      {/* Column 3: Sleek Options Selector (Main Product + Variants) & Buy Box */}
      <div className="lg:col-span-1 space-y-6 p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">

        {/* Options Selector Pills */}
        {hasVariants && (
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-extrabold uppercase text-slate-800 dark:text-slate-200 tracking-wider">
                  Select Model / Edition ({variants.length + 1})
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 truncate max-w-[180px]">
                {selectedVariant ? formatVariantLabel(selectedVariant) : product.name}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">

              {/* Option 1: Main Product using product.name from Admin */}
              <button
                type="button"
                onClick={() => setSelectedVariant(null)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${selectedVariant === null
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-600"
                  : isBaseOutOfStock
                    ? "bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 line-through opacity-70"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-400 hover:text-indigo-600"
                  }`}
              >
                {selectedVariant === null && <Check className="w-3.5 h-3.5 shrink-0" />}
                <span>{product.name}</span>
                {isBaseOutOfStock && (
                  <span className="text-[9px] font-normal no-underline text-rose-500 ml-0.5">(Sold out)</span>
                )}
              </button>

              {/* Options 2..N: Additional Product Variants */}
              {variants.map((v) => {
                const isSelected = selectedVariant?.id === v.id;
                const vLiveInfo = liveStock?.variants ? liveStock.variants[String(v.id)] : null;
                const vStock = vLiveInfo ? vLiveInfo.available_quantity : (v.stock_status?.available_quantity ?? v.stock ?? 0);
                const isVOutOfStock = vStock === 0;

                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariant(v)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${isSelected
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-600"
                      : isVOutOfStock
                        ? "bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 line-through opacity-70"
                        : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-400 hover:text-indigo-600"
                      }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                    <span>{formatVariantLabel(v)}</span>
                    {isVOutOfStock && (
                      <span className="text-[9px] font-normal no-underline text-rose-500 ml-0.5">(Sold out)</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Shipping & Delivery Details */}
        <div className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300 border-y border-slate-200 dark:border-slate-700 py-3">
          <p className="flex items-center gap-1.5 text-emerald-600 font-bold">
            <Truck className="w-4 h-4" /> FREE Delivery by Tomorrow
          </p>
          <p className="flex items-center gap-1.5 text-slate-500">
            <MapPin className="w-3.5 h-3.5 text-amber-500" /> Deliver to India / Pincode
          </p>
        </div>

        {/* Add to Cart Component */}
        <div className="space-y-3 pt-1">
          <AddToCartButton
            productId={product.id}
            variantId={selectedVariant?.id}
            disabled={!isInStock}
          />
        </div>

        <div className="text-[11px] text-slate-500 space-y-1 pt-2">
          <div className="flex justify-between">
            <span>Ships from</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Rastogi Warehouse</span>
          </div>
          <div className="flex justify-between">
            <span>Sold by</span>
            <span className="font-semibold text-amber-600">Rastogi Cartridge</span>
          </div>
          <div className="flex justify-between">
            <span>Payment</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">COD / Online</span>
          </div>
        </div>
                    
      </div>

    </div>
  );
}

// 