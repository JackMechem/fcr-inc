"use client";

import { useEffect, useRef } from "react";
import { useUserDashboardStore } from "@/stores/userDashboardStore";
import { useCartStore, fetchCart } from "@/stores/cartStore";

/**
 * Fetches cart from the API when the user is authenticated.
 * Place this once in a layout-level component (e.g. HeaderMenu).
 */
export function useCartSync() {
    const { isAuthenticated, accountId } = useUserDashboardStore();
    const lastFetchedId = useRef<number | null>(null);

    useEffect(() => {
        if (isAuthenticated && accountId && lastFetchedId.current !== accountId) {
            lastFetchedId.current = accountId;
            useCartStore.getState().clearCart();
            fetchCart(accountId);
        }
        if (!isAuthenticated) {
            lastFetchedId.current = null;
        }
    }, [isAuthenticated, accountId]);
}
