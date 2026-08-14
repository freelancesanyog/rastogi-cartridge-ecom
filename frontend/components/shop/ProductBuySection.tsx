"use client";

import { useState } from "react";
import { CheckCircle, AlertCircle, Truck, MapPin, Layers, Check } from "lucide-react";
import AddToCartButton from "@/components/shop/AddToCartButton";

import { useLiveStock } from "@/hooks/useLiveStock";

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

interface ProductBuySectionProps {
  product: {
    id: number;
    slug?: string;
    price: string;
    mrp?: string;
    discount_percentage?: number;
    stock_status: {
      in_stock: boolean;
      status: string;
      available_quantity: number;
      is_low_stock: boolean;
    };
    variants?: ProductVariant[];
  };
}

export default function ProductBuySection({ product }: ProductBuySectionProps) {
  const variants = product.variants || [];
  const hasVariants = variants.length > 0;

  const { liveStock } = useLiveStock(product.slug || "");

  // Default to first variant if available
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    hasVariants ? variants[0] : null
  );

  const activePrice = selectedVariant
    ? selectedVariant.effective_price
    : product.price;

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

  const formatAttributes = (variant: ProductVariant) => {
    if (variant.attributes && Object.keys(variant.attributes).length > 0) {
      return Object.entries(variant.attributes)
        .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)
        .join(" | ");
    }
    return `Variant (${variant.sku})`;
  };

  return (
    <div className="space-y-6">

      {/* Price & Stock Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-black text-slate-900 dark:text-white">
            ₹{activePrice}
          </span>
          {product.mrp && parseFloat(product.mrp) > parseFloat(activePrice) && (
            <span className="text-sm text-slate-400 line-through">
              M.R.P.: ₹{product.mrp}
            </span>
          )}
        </div>

        {/* Dynamic Stock Status Badge */}
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
      </div>

      {/* Variant Selector Options */}
      {hasVariants && (
        <div className="space-y-2 border-t border-slate-200 dark:border-slate-700 pt-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider">
              Available Options / Variants ({variants.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {variants.map((v) => {
              const isSelected = selectedVariant?.id === v.id;
              const vStock = v.stock_status?.available_quantity ?? v.stock;

              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVariant(v)}
                  className={`p-3 rounded-xl text-left border transition-all flex items-center justify-between gap-2 ${isSelected
                    ? "bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 text-slate-900 dark:text-white shadow-sm ring-1 ring-indigo-500"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-300"
                    }`}
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs capitalize truncate">
                        {formatAttributes(v)}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-slate-400">
                      SKU: {v.sku}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-black text-xs text-slate-900 dark:text-white block">
                      ₹{v.effective_price}
                    </span>
                    <span
                      className={`text-[10px] font-bold ${vStock > 0 ? "text-emerald-500" : "text-rose-500"
                        }`}
                    >
                      {vStock > 0 ? `${vStock} in stock` : "Out of stock"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Shipping details */}
      <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300 border-y border-slate-200 dark:border-slate-700 py-3">
        <p className="flex items-center gap-1 text-emerald-600 font-bold">
          <Truck className="w-4 h-4" /> FREE Delivery by Tomorrow
        </p>
        <p className="flex items-center gap-1 text-slate-500">
          <MapPin className="w-3.5 h-3.5 text-amber-500" /> Deliver to India / Pincode
        </p>
      </div>

      {/* Add to Cart Component with Selected Variant */}
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
  );
} 