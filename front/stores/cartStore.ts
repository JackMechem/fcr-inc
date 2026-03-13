import { CartProps } from "@/app/types/CartTypes";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartStore {
  carData: CartProps[];
  addCar: (car: CartProps) => void;
  removeCar: (vin: string) => void;
  clearCart: () => void;
  inCart: (vin: string) => boolean;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      carData: [],
      addCar: (car) =>
        set((state) => ({
          carData: state.carData.some((c) => c.vin === car.vin)
            ? state.carData
            : [...state.carData, car],
        })),
      removeCar: (vin) =>
        set((state) => ({
          carData: state.carData.filter((c) => c.vin !== vin),
        })),
      clearCart: () => set({ carData: [] }),
      inCart: (vin) => get().carData.some((c) => c.vin === vin),
    }),
    { name: "cart-storage" }
  )
);
