"use client";

import { useState } from "react";
import { ShoppingBag, Loader2, Check } from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { useCartStore } from "@/store/cart-store";

interface AddToCartButtonProps {
  productId: number;
  variantId?: number;
  disabled?: boolean;
}

import { showTopAlert } from "@/lib/swal";

export default function AddToCartButton({ productId, variantId, disabled }: AddToCartButtonProps) {
  const openCart = useCartStore((state) => state.openCart);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleAddToCart = async () => {
    setIsLoading(true);
    setIsSuccess(false);

    try {
      await fetchApi("/cart/items/", {
        method: "POST",
        body: JSON.stringify({
          product_id: productId,
          variant_id: variantId || null,
          quantity: 1,
        }),
      });

      setIsSuccess(true);
      openCart();
      setTimeout(() => setIsSuccess(false), 2000);
    } catch (err: unknown) {
      const errorMsg = (err as Error)?.message || "Failed to add item to cart.";
      showTopAlert(errorMsg, "warning");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={disabled || isLoading}
      className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : isSuccess ? (
        <>
          <Check className="w-5 h-5 text-emerald-300" />
          <span>Added to Cart!</span>
        </>
      ) : (
        <>
          <ShoppingBag className="w-5 h-5" />
          <span>Add to Cart</span>
        </>
      )}
    </button>
  );
}
