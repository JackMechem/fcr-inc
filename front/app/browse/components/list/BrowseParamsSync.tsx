"use client";
import { useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    saveBrowseState,
    getStoredDates,
    getStoredFilters,
    hasExplicitFilterParams,
    setBrowseRedirectPending,
} from "@/app/lib/browseStorage";

/** Saves browse params to localStorage and restores them on initial load. */
const BrowseParamsSync = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const restored = useRef(false);
    const hasMounted = useRef(false);

    // On first mount: restore dates (always if missing) and filters (only if no explicit params)
    useEffect(() => {
        if (restored.current) return;
        restored.current = true;

        const current = new URLSearchParams(searchParams.toString());
        const merged = new URLSearchParams(current.toString());
        let changed = false;

        // Always restore dates if not already in URL
        const storedDates = getStoredDates();
        storedDates.forEach((v, k) => {
            if (!current.has(k)) {
                merged.set(k, v);
                changed = true;
            }
        });

        // Restore filters only when URL has no explicit filter params
        if (!hasExplicitFilterParams(current)) {
            const storedFilters = getStoredFilters();
            storedFilters.forEach((v, k) => {
                if (!merged.has(k)) {
                    merged.set(k, v);
                    changed = true;
                }
            });
        }

        if (changed) {
            setBrowseRedirectPending(true);
            router.replace(`/browse?${merged.toString()}`);
        } else {
            setBrowseRedirectPending(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Save to localStorage whenever URL params change.
    // Also clears the redirect-pending flag after a redirect completes (searchParams
    // changes after mount), so InfiniteCarList's fetch isn't permanently blocked.
    useEffect(() => {
        if (!hasMounted.current) {
            hasMounted.current = true;
        } else {
            // searchParams changed after initial mount — redirect has completed
            setBrowseRedirectPending(false);
        }
        saveBrowseState(new URLSearchParams(searchParams.toString()));
    }, [searchParams.toString()]);

    return null;
};

export default BrowseParamsSync;
