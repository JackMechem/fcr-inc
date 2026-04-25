import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AdminView =
    | "add-car" | "edit-car"
    | "view-data" | "view-reservations" | "view-accounts" | "view-users"
    | "list-data" | "list-reservations" | "list-accounts" | "list-users"
    | null;

// Views that are transient and should not be restored on refresh.
const TRANSIENT_VIEWS: AdminView[] = ["add-car", "edit-car"];

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
                // Don't restore transient views (add/edit car) — fall back to dashboard.
                activeView: TRANSIENT_VIEWS.includes(state.activeView) ? null : state.activeView,
            }),
        }
    )
);
