"use client";

import { useEffect, useRef } from "react";
import { useUserDashboardStore } from "@/stores/userDashboardStore";
import { fetchBookmarks } from "@/stores/bookmarkStore";

/**
 * Fetches bookmarks from the API when the user is authenticated.
 * Place this once in a layout-level component (e.g. HeaderMenu).
 */
export function useBookmarkSync() {
    const { isAuthenticated, accountId } = useUserDashboardStore();
    const lastFetchedId = useRef<number | null>(null);

    useEffect(() => {
        if (isAuthenticated && accountId && lastFetchedId.current !== accountId) {
            lastFetchedId.current = accountId;
            fetchBookmarks(accountId);
        }
        if (!isAuthenticated) {
            lastFetchedId.current = null;
        }
    }, [isAuthenticated, accountId]);
}
