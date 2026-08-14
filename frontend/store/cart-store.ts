import { create } from "zustand";

interface CartState {
  isCartOpen: boolean;
  itemCount: number;
  subtotal: string;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  setCartSummary: (itemCount: number, subtotal: string) => void;
}

export const useCartStore = create<CartState>((set) => ({
  isCartOpen: false,
  itemCount: 0,
  subtotal: "0.00",
  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
  setCartSummary: (itemCount, subtotal) => set({ itemCount, subtotal }),
}));
