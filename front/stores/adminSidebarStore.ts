import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AdminView = "add-car" | "edit-car" | "view-data" | "view-reservations" | null;

interface AdminSidebarStore {
    collapsed: boolean;
    activeView: AdminView;
    editVin: string | null;
    toggle: () => void;
    setCollapsed: (collapsed: boolean) => void;
    setActiveView: (view: AdminView) => void;
    openEditCar: (vin: string) => void;
    setEditVin: (vin: string | null) => void;
}

export const useAdminSidebarStore = create<AdminSidebarStore>()(
    persist(
        (set, get) => ({
            collapsed: false,
            activeView: null,
            editVin: null,
            toggle: () => set({ collapsed: !get().collapsed }),
            setCollapsed: (collapsed) => set({ collapsed }),
            setActiveView: (view) => set({ activeView: view }),
            openEditCar: (vin) => set({ activeView: "edit-car", editVin: vin }),
            setEditVin: (vin) => set({ editVin: vin }),
        }),
        {
            name: "admin-sidebar",
            partialize: (state) => ({
                collapsed: state.collapsed,
                activeView: state.activeView,
            }),
        }
    )
);
