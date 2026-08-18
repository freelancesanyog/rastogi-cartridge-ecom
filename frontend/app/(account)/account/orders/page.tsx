"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { Package, ChevronRight, Printer, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { EmptyState } from "@/components/ui/EmptyState";
import { getImageUrl } from "@/lib/utils";

interface OrderSummaryItem {
  id: number;
  product_name: string;
  product_slug?: string;
  product_image?: string;
  quantity: number;
  product_sku: string;
  line_total: string | number;
}

interface OrderSummary {
  id: number;
  order_number: string;
  created_at: string;
  status: string;
  total_amount: string | number;
  items?: OrderSummaryItem[];
}

export default function OrderHistoryPage() {
  const { data: ordersRes, isLoading } = useQuery({
    queryKey: ["user-orders"],
    queryFn: () => fetchApi("/orders/"),
  });

  const orders: OrderSummary[] = Array.isArray((ordersRes as { results?: OrderSummary[] })?.results)
    ? (ordersRes as { results: OrderSummary[] }).results
    : Array.isArray(ordersRes)
      ? (ordersRes as OrderSummary[])
      : [];

  if (isLoading) {
    return (
      <div className="py-12 text-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No Orders Placed Yet"
        description="You haven't placed any orders with Rastogi Cartridge yet."
        actionText="Start Shopping"
        actionHref="/catalog"
      />
    );
  }

  return (
    <div className="space-y-6">

      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          My Order History ({orders.length})
        </h1>
      </div>

      <div className="space-y-4">
        {orders.map((order: OrderSummary) => (
          <div
            key={order.id}
            className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm hover:shadow-md transition-all"
          >
            {/* Order Card Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="space-y-0.5">
                <Link
                  href={`/account/orders/${order.order_number}`}
                  className="font-mono text-sm font-bold text-slate-900 dark:text-white hover:text-amber-600 transition-colors"
                >
                  Order #{order.order_number}
                </Link>
                <p className="text-xs text-slate-400">
                  Placed on {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold capitalize">
                  {order.status.replace("_", " ")}
                </span>
                <Link
                  href={`/account/orders/${order.order_number}`}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            </div>

            {/* Product Thumbnails List */}
            <div className="space-y-3">
              {order.items?.map((item: OrderSummaryItem) => {
                const productUrl = item.product_slug ? `/product/${item.product_slug}` : `/catalog`;

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80"
                  >
                    {/* Clickable Image & Name */}
                    <div className="flex items-center gap-3 min-w-0">
                      <Link
                        href={productUrl}
                        className="relative w-14 h-14 shrink-0 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center p-1 hover:border-amber-400 transition-colors group"
                      >
                        {item.product_image ? (
                          <Image
                            src={getImageUrl(item.product_image)}
                            alt={item.product_name}
                            fill
                            sizes="56px"
                            className="object-contain p-1 group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <Printer className="w-6 h-6 text-slate-300 dark:text-slate-700" />
                        )}
                      </Link>

                      <div className="space-y-0.5 min-w-0">
                        <Link
                          href={productUrl}
                          className="font-bold text-xs text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 transition-colors line-clamp-1"
                        >
                          {item.product_name}
                        </Link>
                        <p className="text-[10px] text-slate-400 font-mono">
                          Qty: {item.quantity} • SKU: {item.product_sku}
                        </p>
                      </div>
                    </div>

                    <span className="font-extrabold text-xs text-slate-900 dark:text-white shrink-0">
                      ₹{item.line_total}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Total Footer */}
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
              <Link
                href={`/account/orders/${order.order_number}`}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                View Order Details & Status →
              </Link>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">Total Amount</span>
                <span className="text-base font-black text-slate-900 dark:text-white">
                  ₹{order.total_amount}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
