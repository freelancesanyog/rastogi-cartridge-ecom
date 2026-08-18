"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { X, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { fetchApi } from "@/lib/api-client";
import { useEffect } from "react";

import { showTopAlert } from "@/lib/swal";

interface DrawerCartItem {
  id: number;
  product: {
    name: string;
    sku: string;
  };
  price_at_add: string | number;
  quantity: number;
  line_total: string | number;
}

interface CartDrawerData {
  items?: DrawerCartItem[];
  item_count?: number;
  subtotal?: string | number;
  discount_amount?: string | number;
  total_amount?: string | number;
}

export default function CartDrawer() {
  const { isCartOpen, closeCart, setCartSummary } = useCartStore();

  const { data: cart, refetch } = useQuery<CartDrawerData>({
    queryKey: ["cart"],
    queryFn: () => fetchApi("/cart/"),
  });

  useEffect(() => {
    if (cart) {
      setCartSummary(
        cart.item_count || 0,
        String(cart.total_amount || cart.subtotal || "0.00")
      );
    }
  }, [cart, setCartSummary]);

  const handleUpdateQuantity = async (itemId: number, newQty: number) => {
    try {
      await fetchApi(`/cart/items/${itemId}/`, {
        method: "PATCH",
        body: JSON.stringify({ quantity: newQty }),
      });
      refetch();
    } catch (err: unknown) {
      const errorMsg = (err as Error)?.message || "Failed to update quantity";
      showTopAlert(errorMsg, "warning");
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      await fetchApi(`/cart/items/${itemId}/`, { method: "DELETE" });
      refetch();
    } catch (err: unknown) {
      const errorMsg = (err as Error)?.message || "Failed to remove item";
      showTopAlert(errorMsg, "warning");
    }
  };

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">

      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right">

          {/* Drawer Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Your Shopping Cart</h2>
            </div>
            <button
              onClick={closeCart}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {!cart || !cart.items || cart.items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-3">
                <ShoppingBag className="w-12 h-12 stroke-1" />
                <p className="text-sm font-medium">Your cart is currently empty.</p>
              </div>
            ) : (
              cart.items.map((item: DrawerCartItem) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {item.product.name}
                    </h4>
                    <p className="text-xs text-slate-400">SKU: {item.product.sku}</p>
                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                      ₹{item.price_at_add} x {item.quantity} = ₹{item.line_total}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                      className="w-14 px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-center"
                    />
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer */}
          {cart && cart.items && cart.items.length > 0 && (
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900 dark:text-white">₹{cart.subtotal}</span>
                </div>
                {cart.discount_amount && Number(cart.discount_amount) > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600 font-medium">
                    <span>Coupon Discount</span>
                    <span>-₹{cart.discount_amount}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-800 pt-2">
                  <span>Total</span>
                  <span className="text-indigo-600 dark:text-indigo-400">₹{cart.total_amount || cart.subtotal}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                onClick={closeCart}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-md shadow-indigo-600/20"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
