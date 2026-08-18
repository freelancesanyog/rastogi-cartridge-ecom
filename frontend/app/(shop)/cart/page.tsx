"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ShoppingBag, Trash2, ArrowRight, Tag, Check, AlertCircle, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { EmptyState } from "@/components/ui/EmptyState";

interface FullCartItem {
  id: number;
  product: {
    id: number;
    name: string;
    sku: string;
    slug?: string;
  };
  price_at_add: string | number;
  line_total: string | number;
  quantity: number;
  unit_price: string | number;
  total_price: string | number;
}

interface FullCartData {
  items?: FullCartItem[];
  item_count?: number;
  coupon_code?: string;
  discount_amount?: string | number;
  subtotal?: string | number;
  total_amount?: string | number;
}

export default function CartPage() {
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const { data: cart, isLoading, refetch } = useQuery<FullCartData>({
    queryKey: ["cart-full-page"],
    queryFn: () => fetchApi("/cart/"),
  });

  const handleUpdateQuantity = async (itemId: number, quantity: number) => {
    try {
      await fetchApi(`/cart/items/${itemId}/`, {
        method: "PATCH",
        body: JSON.stringify({ quantity }),
      });
      refetch();
    } catch (err: unknown) {
      const errorMsg = (err as Error)?.message || "Failed to update quantity";
      alert(errorMsg);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      await fetchApi(`/cart/items/${itemId}/`, { method: "DELETE" });
      refetch();
    } catch (err: unknown) {
      const errorMsg = (err as Error)?.message || "Failed to remove item";
      alert(errorMsg);
    }
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponError(null);
    setCouponLoading(true);

    try {
      await fetchApi("/promotions/apply/", {
        method: "POST",
        body: JSON.stringify({ code: couponCode.trim() }),
      });
      setCouponCode("");
      refetch();
    } catch (err: unknown) {
      const errorMsg = (err as Error)?.message || "Failed to apply coupon.";
      setCouponError(errorMsg);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      await fetchApi("/promotions/remove/", { method: "POST" });
      refetch();
    } catch (err: unknown) {
      const errorMsg = (err as Error)?.message || "Failed to remove coupon";
      alert(errorMsg);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
      </div>
    );
  }

  const isEmpty = !cart || !cart.items || cart.items.length === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Shopping Cart ({cart?.item_count || 0})
        </h1>
      </div>

      {isEmpty ? (
        <EmptyState
          icon={ShoppingBag}
          title="Your Cart is Empty"
          description="Looks like you haven't added any items to your shopping cart yet."
          actionText="Explore Products"
          actionHref="/catalog"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            {cart?.items?.map((item: FullCartItem) => (
              <div
                key={item.id}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
              >
                <div className="space-y-1 min-w-0">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                    {item.product.name}
                  </h3>
                  <p className="text-xs text-slate-400">SKU: {item.product.sku}</p>
                  <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 pt-1">
                    ${item.price_at_add} x {item.quantity} = ${item.line_total}
                  </p>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                    className="w-16 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white text-center font-semibold"
                  />
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                    title="Remove Item"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary & Coupon Section */}
          <div className="space-y-6">

            {/* Coupon Code Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  Promotional Coupon
                </h3>
              </div>

              {cart.coupon_code ? (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    <span>Coupon &apos;{cart.coupon_code}&apos; Applied</span>
                  </span>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-rose-500 hover:underline text-[11px]"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter Coupon Code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white uppercase font-bold placeholder:normal-case placeholder:font-normal"
                    />
                    <button
                      type="submit"
                      disabled={couponLoading || !couponCode.trim()}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors disabled:opacity-50"
                    >
                      {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-[11px] text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{couponError}</span>
                    </p>
                  )}
                </form>
              )}
            </div>

            {/* Order Summary Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
                Order Summary
              </h3>

              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900 dark:text-white">${cart.subtotal}</span>
                </div>

                {cart.discount_amount && Number(cart.discount_amount) > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Coupon Discount</span>
                    <span>-${cart.discount_amount}</span>
                  </div>
                )}

                <div className="flex justify-between text-xs text-slate-400 pt-1">
                  <span>Estimated Tax & Shipping</span>
                  <span>Calculated at checkout</span>
                </div>

                <div className="flex justify-between text-lg font-black text-slate-900 dark:text-white border-t border-slate-100 dark:border-slate-800 pt-3">
                  <span>Total</span>
                  <span className="text-indigo-600 dark:text-indigo-400">${cart.total_amount || cart.subtotal}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/30"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
