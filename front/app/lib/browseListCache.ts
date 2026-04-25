/**
 * Module-level in-memory cache for the browse car list.
 * Survives Next.js client-side navigation (module is never re-evaluated),
 * so navigating back from a car detail page restores the exact list state.
 * Cleared on a hard refresh or tab close (intentional — stale data isn't useful).
 */

import type { Car } from "@/app/types/CarTypes";

interface BrowseListState {
    cars: Car[];
    page: number;
    hasMore: boolean;
    scrollY: number;
    paramsKey: string;
}

let _cache: BrowseListState | null = null;

export function saveBrowseListCache(state: BrowseListState): void {
    _cache = state;
}

export function getBrowseListCache(paramsKey: string): BrowseListState | null {
    if (!_cache || _cache.paramsKey !== paramsKey) return null;
    return _cache;
}

export function clearBrowseListCache(): void {
    _cache = null;
}
