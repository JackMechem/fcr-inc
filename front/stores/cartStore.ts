import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartStore {
  vins: string[];
  addVin: (vin: string) => void;
  removeVin: (vin: string) => void;
  clearCart: () => void;
  hasVin: (vin: string) => boolean;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      vins: [],
      addVin: (vin) =>
        set((state) => ({
          vins: state.vins.includes(vin) ? state.vins : [...state.vins, vin],
        })),
      removeVin: (vin) =>
        set((state) => ({
          vins: state.vins.filter((v) => v !== vin),
        })),
      clearCart: () => set({ vins: [] }),
      hasVin: (vin) => get().vins.includes(vin),
    }),
    { name: "cart-storage" }
  )
);
