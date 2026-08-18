"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { CheckCircle, Truck, ArrowRight, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api-client";

interface ConfirmationOrderItem {
  id: number;
  quantity: number;
  product_name: string;
  line_total: string | number;
}

interface OrderConfirmationDetail {
  order_number: string;
  created_at: string;
  status: string;
  subtotal?: string | number;
  total_amount?: string | number;
  discount_amount?: string | number | any;
  coupon_code?: string;
  shipping_address?: {
    recipient_name: string;
    street_address: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    phone_number: string;
  };
  items?: ConfirmationOrderItem[];
}

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order");

  const { data: order, isLoading } = useQuery<OrderConfirmationDetail>({
    queryKey: ["order-confirmation", orderNumber],
    queryFn: () => fetchApi(`/orders/${orderNumber}/`),
    enabled: !!orderNumber,
  });

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 space-y-8">

      {/* Confirmation Hero Card */}
      <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-xl">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20">
          <CheckCircle className="w-10 h-10" />
        </div>

        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Order Confirmed!
          </h1>
          <p className="text-sm text-slate-500">
            Thank you for shopping with Rastogi Cartridge.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-mono text-sm font-bold">
          Order Number: #{orderNumber || order?.order_number}
        </div>
      </div>

      {/* COD Payment Notice */}
      <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 space-y-2 text-xs">
        <div className="flex items-center gap-2 font-bold text-sm">
          <Truck className="w-4 h-4 text-amber-600" />
          <span>Cash on Delivery Notice</span>
        </div>
        <p>
          Please keep exact cash ready upon delivery. Our delivery executive will collect ₹ {order?.total_amount || "0.00"} cash at the time of delivery.
        </p>
      </div>

      {/* Delivery Address & Order Items Summary */}
      {order && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Shipping Address */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider mb-2">
              Delivery Address
            </h3>
            <p className="font-bold text-slate-900 dark:text-white">{order.shipping_address?.recipient_name}</p>
            <p>{order.shipping_address?.street_address}</p>
            <p>{order.shipping_address?.city}, {order.shipping_address?.state} {order.shipping_address?.postal_code}</p>
            <p>{order.shipping_address?.country}</p>
            <p className="pt-1 font-mono">Phone: {order.shipping_address?.phone_number}</p>
          </div>

          {/* Items Summary */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider mb-2">
              Items Ordered ({order.items?.length || 0})
            </h3>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {order.items?.map((item: ConfirmationOrderItem) => (
                <div key={item.id} className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                  <span className="truncate pr-2">{item.quantity}x {item.product_name}</span>
                  <span className="font-bold">₹ {item.line_total}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-1.5">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900 dark:text-white">₹ {order.subtotal || order.total_amount}</span>
              </div>

              {order.discount_amount && parseFloat(order.discount_amount) > 0 && (
                <div className="flex justify-between items-center text-emerald-600 font-medium">
                  <span className="flex items-center gap-1">
                    <span>Coupon Discount</span>
                    {order.coupon_code && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[10px] font-bold border border-emerald-500/20 uppercase">
                        {order.coupon_code}
                      </span>
                    )}
                  </span>
                  <span className="font-bold">-₹ {order.discount_amount}</span>
                </div>
              )}

              <div className="border-t border-slate-100 dark:border-slate-800 pt-2 flex justify-between font-black text-sm text-slate-900 dark:text-white">
                <span>Total Due on Delivery</span>
                <span className="text-indigo-600 dark:text-indigo-400">₹ {order.total_amount}</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md"
        >
          <span>Continue Shopping</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-slate-400"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>}>
      <OrderConfirmationContent />
    </Suspense>
  );
}
