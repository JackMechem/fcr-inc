import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserDashboardView = "reservations" | "edit-reservation" | "user-details";

export interface DashboardReservation {
    reservationId: number;
    carVin: string;
    userId: number;
    paymentIds: string[];
    pickUpTime: number | string;
    dropOffTime: number | string;
    dateBooked: number | string;
    duration: number;
    durationHours: number;
    durationDays: number;
    car: { vin: string; make: string; model: string; images: string[] } | null;
}

interface UserDashboardStore {
    collapsed: boolean;
    activeView: UserDashboardView;
    userId: number | null;
    /** Email used for guest lookup. Will be null for fully-authenticated users once accounts are added. */
    userEmail: string | null;
    /**
     * false  → guest mode (email lookup, no session)
     * true   → authenticated (future: real login session)
     * Components should branch on this to show appropriate UI.
     */
    isAuthenticated: boolean;
    selectedReservation: DashboardReservation | null;
    toggle: () => void;
    setActiveView: (view: UserDashboardView) => void;
    setUserId: (id: number | null) => void;
    setUserEmail: (email: string | null) => void;
    setAuthenticated: (value: boolean) => void;
    openEditReservation: (reservation: DashboardReservation) => void;
}

export const useUserDashboardStore = create<UserDashboardStore>()(
    persist(
        (set, get) => ({
            collapsed: false,
            activeView: "reservations",
            userId: null,
            userEmail: null,
            isAuthenticated: false,
            selectedReservation: null,
            toggle: () => set({ collapsed: !get().collapsed }),
            setActiveView: (view) => set({ activeView: view }),
            setUserId: (id) => set({ userId: id }),
            setUserEmail: (email) => set({ userEmail: email }),
            setAuthenticated: (value) => set({ isAuthenticated: value }),
            openEditReservation: (reservation) =>
                set({ selectedReservation: reservation, activeView: "edit-reservation" }),
        }),
        {
            name: "user-dashboard",
            partialize: (state) => ({ collapsed: state.collapsed }),
        }
    )
);
