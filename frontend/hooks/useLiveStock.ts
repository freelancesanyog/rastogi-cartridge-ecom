"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { fetchApi } from "@/lib/api-client";

export interface StockStatusInfo {
  available_quantity: number;
  in_stock: boolean;
  low_stock: boolean;
}

export interface LiveStockData {
  product: StockStatusInfo;
  variants: Record<string, StockStatusInfo>;
}

export function useLiveStock(productSlug: string, initialStock?: LiveStockData) {
  const [liveStock, setLiveStock] = useState<LiveStockData | null>(initialStock || null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const isMountedRef = useRef<boolean>(true);

  const fetchLiveStock = useCallback(async () => {
    if (!productSlug) return;
    if (typeof document !== "undefined" && document.visibilityState !== "visible") {
      return;
    }

    try {
      setIsLoading(true);
      const data = await fetchApi<LiveStockData>(
        `/catalog/products/${productSlug}/stock/?_t=${Date.now()}`
      );
      if (isMountedRef.current && data) {
        setLiveStock(data);
        setIsError(false);
      }
    } catch (err) {
      console.warn("Live stock polling failed (retaining previous stock state):", err);
      if (isMountedRef.current) {
        setIsError(true);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [productSlug]);

  useEffect(() => {
    isMountedRef.current = true;

    // Initial fetch on mount
    fetchLiveStock();

    // 4-second HTTP polling loop
    const intervalId = setInterval(fetchLiveStock, 4000);

    // Tab visibility listener: pause when hidden, refetch immediately when visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchLiveStock();
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    };
  }, [fetchLiveStock]);

  return { liveStock, isLoading, isError, refetch: fetchLiveStock };
}
