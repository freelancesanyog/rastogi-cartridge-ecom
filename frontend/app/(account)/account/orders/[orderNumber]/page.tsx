"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  Package,
  Truck,
  Clock,
  CheckCircle,
  AlertCircle,
  Ban,
  ArrowLeft,
  Loader2,
  Star,
  Printer,
} from "lucide-react";
import Link from "next/link";
import { fetchApi } from "@/lib/api-client";
import { useState } from "react";
import { toast } from "react-toastify";
import { confirmAlert } from "react-confirm-alert";
import ReviewModal from "@/components/reviews/ReviewModal";
import { getImageUrl } from "@/lib/utils";
import "react-toastify/dist/ReactToastify.css";
import "react-confirm-alert/src/react-confirm-alert.css";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderNumber = params.orderNumber as string;

  const [isCancelling, setIsCancelling] = useState(false);
  const [selectedItemForReview, setSelectedItemForReview] = useState<any>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const { data: order, isLoading, refetch } = useQuery({
    queryKey: ["order-detail", orderNumber],
    queryFn: () => fetchApi(`/orders/${orderNumber}/`),
    enabled: !!orderNumber,
  });

  const { data: myReviewsRes, refetch: refetchReviews } = useQuery({
    queryKey: ["my-reviews"],
    queryFn: () => fetchApi("/reviews/?my_reviews=true"),
  });

  const myReviews = Array.isArray(myReviewsRes?.results)
    ? myReviewsRes.results
    : Array.isArray(myReviewsRes)
      ? myReviewsRes
      : [];

  const reviewsByProductId: Record<number, any> = {};
  myReviews.forEach((rev: any) => {
    if (rev.product) {
      reviewsByProductId[rev.product] = rev;
    }
  });

  const handleCancelOrder = async () => {
    confirmAlert({
      title: "Cancel Order",
      message: "Are you sure you want to cancel this order?",
      buttons: [
        {
          label: "Yes, Cancel Order",
          onClick: async () => {
            setIsCancelling(true);
            try {
              await fetchApi(`/orders/${orderNumber}/cancel/`, {
                method: "POST",
                body: JSON.stringify({
                  reason: "Cancelled by customer via account portal.",
                  cancellation_reason: "Cancelled by customer via account portal.",
                }),
              });
              toast.success("Order cancelled successfully!");
              refetch();
            } catch (err: any) {
              toast.error(err.message || "Failed to cancel order.");
            } finally {
              setIsCancelling(false);
            }
          },
        },
        {
          label: "No",
          onClick: () => toast.info("Order cancellation aborted"),
        },
      ],
    });
  };

  const openReviewModal = (item: any) => {
    setSelectedItemForReview(item);
    setIsReviewModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
      </div>
    );
  }

  if (!order) {
    return <div className="p-8 text-center text-slate-400">Order not found.</div>;
  }

  const canCancel = ["pending_confirmation", "confirmed"].includes(order.status);
  const isDelivered = order.status === "delivered";

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="space-y-1">
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-1 text-xs text-indigo-600 font-bold hover:underline mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Orders</span>
          </Link>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Order #{order.order_number}
          </h1>
          <p className="text-xs text-slate-400">
            Placed on {new Date(order.created_at).toLocaleString()}
          </p>
        </div>

        {canCancel && (
          <button
            onClick={handleCancelOrder}
            disabled={isCancelling}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-colors disabled:opacity-50"
          >
            {isCancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
            <span>Cancel Order</span>
          </button>
        )}
      </div>

      {/* Delivered Order Review Callout Banner */}
      {isDelivered && (
        <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-300 space-y-1 text-xs shadow-sm">
          <div className="flex items-center gap-2 font-black text-sm">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <span>Order Delivered Successfully!</span>
          </div>
          <p className="text-emerald-700 dark:text-emerald-400">
            Thank you for shopping with Rastogi Cartridge! Share your feedback below to help other buyers.
          </p>
        </div>
      )}

      {/* Status Timeline */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
          Order Status:{" "}
          <span className="text-indigo-600 dark:text-indigo-400 capitalize">
            {order.status.replace("_", " ")}
          </span>
        </h3>

        {order.status_history && order.status_history.length > 0 && (
          <div className="space-y-3 pt-2">
            {order.status_history.map((hist: any) => (
              <div
                key={hist.id}
                className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400"
              >
                <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>
                  {hist.from_status} → <strong>{hist.to_status}</strong>
                </span>
                <span className="text-slate-400 font-mono">
                  ({new Date(hist.created_at).toLocaleTimeString()})
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Items & Shipping Address Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Shipping Address */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-400 shadow-sm">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider mb-2">
            Shipping Address
          </h3>
          <p className="font-bold text-slate-900 dark:text-white">
            {order.shipping_address?.recipient_name}
          </p>
          <p>{order.shipping_address?.street_address}</p>
          <p>
            {order.shipping_address?.city}, {order.shipping_address?.state}{" "}
            {order.shipping_address?.postal_code}
          </p>
          <p>{order.shipping_address?.country}</p>
          <p className="pt-1 font-mono">Phone: {order.shipping_address?.phone_number}</p>
        </div>

        {/* Items Summary with Product Image & Review Button */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs shadow-sm">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider mb-2">
            Items Ordered ({order.items?.length || 0})
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {order.items?.map((item: any) => {
              const existingRev = item.product_id ? reviewsByProductId[item.product_id] : null;
              const productUrl = item.product_slug ? `/product/${item.product_slug}` : `/catalog`;

              return (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3"
                >
                  <div className="flex justify-between items-center gap-3 text-slate-700 dark:text-slate-300">

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
                          className="font-bold text-xs text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 transition-colors line-clamp-2"
                        >
                          {item.quantity}x {item.product_name}
                        </Link>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          SKU: {item.product_sku}
                        </span>
                      </div>
                    </div>

                    <span className="font-extrabold text-xs shrink-0">₹{item.line_total}</span>
                  </div>

                  {/* Write / Edit Review Button for Delivered Orders */}
                  {isDelivered && item.product_id && (
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                      {existingRev ? (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>Your Rating: {existingRev.rating}/5</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">
                          Delivered • Leave product feedback
                        </span>
                      )}

                      <button
                        onClick={() => openReviewModal(item)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-[11px] font-black transition-all shadow-sm active:scale-95"
                      >
                        <Star className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                        <span>{existingRev ? "Edit Review" : "Write Review"}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-1.5">
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                ₹{order.subtotal || order.total_amount}
              </span>
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
                <span className="font-bold">-₹{order.discount_amount}</span>
              </div>
            )}

            <div className="border-t border-slate-100 dark:border-slate-800 pt-2 flex justify-between font-black text-sm text-slate-900 dark:text-white">
              <span>Total Amount</span>
              <span className="text-indigo-600 dark:text-indigo-400">₹{order.total_amount}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Interactive Review Modal */}
      {selectedItemForReview && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setSelectedItemForReview(null);
          }}
          productId={selectedItemForReview.product_id}
          productName={selectedItemForReview.product_name}
          existingReview={reviewsByProductId[selectedItemForReview.product_id]}
          onSuccess={() => {
            refetchReviews();
            refetch();
          }}
        />
      )}

    </div>
  );
}
