"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Truck, ShieldCheck, Tag, ArrowRight, Check, AlertCircle, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api-client";

interface CartResponse {
  items?: Array<{
    id: number;
    quantity: number;
    product: { name: string };
    price_at_add: string;
    line_total: string;
  }>;
  item_count?: number;
  coupon_code?: string;
  discount_amount?: string | number | any;
  subtotal?: string | number;
  total_amount?: string | number;
}

export default function CheckoutPage() {
  const router = useRouter();

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Address State
  const [addressData, setAddressData] = useState({
    street_address: "123 Main Street",
    city: "San Francisco",
    state: "CA",
    postal_code: "94105",
    country: "United States",
    recipient_name: "John Doe",
    phone_number: "+1 555-0199",
  });

  // Fetch Cart
  const { data: cart, refetch: refetchCart } = useQuery<CartResponse>({
    queryKey: ["checkout-cart"],
    queryFn: () => fetchApi("/cart/"),
  });

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
      refetchCart();
    } catch (err: unknown) {
      const errorMsg = (err as Error)?.message || "Invalid coupon code.";
      setCouponError(errorMsg);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      await fetchApi("/promotions/remove/", { method: "POST" });
      refetchCart();
    } catch (err: unknown) {
      const errorMsg = (err as Error)?.message || "Failed to remove coupon";
      alert(errorMsg);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);

    if (!cart || !cart.items || cart.items.length === 0) {
      setCheckoutError("Your shopping cart is empty.");
      return;
    }

    setIsSubmitting(true);

    try {
      const order = await fetchApi<{ order_number: string }>("/orders/checkout/", {
        method: "POST",
        body: JSON.stringify({
          shipping_address: addressData,
          payment_method: paymentMethod,
        }),
      });

      router.push(`/checkout/confirmation?order=${order.order_number}`);
    } catch (err: unknown) {
      const errorMsg = (err as Error)?.message || "Failed to place order. Please try again.";
      setCheckoutError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">

      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Checkout
        </h1>
      </div>

      {checkoutError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{checkoutError}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Shipping Address & Payment Selection Column */}
        <div className="lg:col-span-2 space-y-8">

          {/* Shipping Address Form */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <Truck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Shipping Address</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={addressData.recipient_name}
                  onChange={(e) => setAddressData({ ...addressData, recipient_name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={addressData.phone_number}
                  onChange={(e) => setAddressData({ ...addressData, phone_number: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={addressData.street_address}
                  onChange={(e) => setAddressData({ ...addressData, street_address: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">City</label>
                <input
                  type="text"
                  required
                  value={addressData.city}
                  onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">State / Province</label>
                <input
                  type="text"
                  required
                  value={addressData.state}
                  onChange={(e) => setAddressData({ ...addressData, state: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Postal Code</label>
                <input
                  type="text"
                  required
                  value={addressData.postal_code}
                  onChange={(e) => setAddressData({ ...addressData, postal_code: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Country</label>
                <input
                  type="text"
                  required
                  value={addressData.country}
                  onChange={(e) => setAddressData({ ...addressData, country: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Extensible Payment Method Radio Group */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Payment Method</h2>
            </div>

            <div className="space-y-3 pt-2">

              {/* Cash on Delivery (Selected Option) */}
              <label className="flex items-start gap-4 p-4 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500 cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">Cash on Delivery (COD)</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">Active</span>
                  </div>
                  <p className="text-xs text-slate-500">Pay with cash when your items are delivered to your doorstep.</p>
                </div>
              </label>

              {/* Online Payment (Extensible Placeholder) */}
              <label className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="online_gateway"
                  disabled
                  className="mt-1"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">Cards / Razorpay / UPI</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold">Coming Soon</span>
                  </div>
                  <p className="text-xs text-slate-500">Online payment gateway integration ready for next release.</p>
                </div>
              </label>

            </div>
          </div>

        </div>

        {/* Order Summary & Submit Column */}
        <div className="space-y-6">

          {/* Coupon Code Section */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                Coupon Code
              </h3>
            </div>

            {cart?.coupon_code ? (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>&apos;{cart.coupon_code}&apos; Applied</span>
                </span>
                <button type="button" onClick={handleRemoveCoupon} className="text-rose-500 hover:underline text-[11px]">
                  Remove
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Coupon Code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white uppercase font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors disabled:opacity-50"
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
              </div>
            )}
          </div>

          {/* Real-time Order Summary */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
              Order Summary
            </h3>

            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Items ({cart?.item_count || 0})</span>
                <span className="font-semibold text-slate-900 dark:text-white">₹{cart?.subtotal || "0.00"}</span>
              </div>

              {cart?.discount_amount && parseFloat(cart.discount_amount) > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Coupon Discount</span>
                  <span>-₹{cart.discount_amount}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-semibold text-emerald-600">FREE</span>
              </div>

              <div className="flex justify-between text-base font-black text-slate-900 dark:text-white border-t border-slate-100 dark:border-slate-800 pt-3">
                <span>Total Due on Delivery</span>
                <span className="text-indigo-600 dark:text-indigo-400">₹{cart?.total_amount || cart?.subtotal || "0.00"}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !cart || !cart.items || cart.items.length === 0}
              className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Place COD Order</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </div>

      </form>

    </div>
  );
}
