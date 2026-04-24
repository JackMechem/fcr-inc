import { create } from "zustand";
import { browserApi } from "@/app/lib/fcr-client";

export interface BookmarkCar {
    vin: string;
    make: string;
    model: string;
    pricePerDay: number;
    image?: string;
}

interface BookmarkStore {
    bookmarks: BookmarkCar[];
    loading: boolean;
    setBookmarks: (cars: BookmarkCar[]) => void;
    setLoading: (v: boolean) => void;
    isBookmarked: (vin: string) => boolean;
}

export const useBookmarkStore = create<BookmarkStore>()((set, get) => ({
    bookmarks: [],
    loading: false,
    setBookmarks: (cars) => set({ bookmarks: cars }),
    setLoading: (v) => set({ loading: v }),
    isBookmarked: (vin) => get().bookmarks.some((b) => b.vin === vin),
}));

// ── API helpers ──────────────────────────────────────────────────────────────

function parseBookmarks(raw: unknown[]): BookmarkCar[] {
    return raw.map((c: unknown) => {
        if (typeof c === "string") return { vin: c, make: "", model: "", pricePerDay: 0 };
        const obj = c as Record<string, unknown>;
        return {
            vin: obj.vin as string,
            make: (obj.make as string) ?? "",
            model: (obj.model as string) ?? "",
            pricePerDay: (obj.pricePerDay as number) ?? 0,
            image: ((obj.images as string[]) ?? [])[0] ?? undefined,
        };
    });
}

/** Fetch bookmarks from the API and update the store */
export async function fetchBookmarks(accountId: number) {
    try {
        useBookmarkStore.getState().setLoading(true);
        const data = await browserApi.bookmarks.get(accountId);
        const raw = data.bookmarkedCars;
        const cars = Array.isArray(raw) ? parseBookmarks(raw as unknown[]) : [];
        useBookmarkStore.getState().setBookmarks(cars);
    } catch (err) {
        console.error("[bookmarks] GET error:", err);
    } finally {
        useBookmarkStore.getState().setLoading(false);
    }
}

/** Save the given VIN list to the API, then refetch to get full objects */
async function saveAndRefresh(accountId: number, vins: { vin: string }[]) {
    try {
        await browserApi.bookmarks.update(accountId, vins);
        await fetchBookmarks(accountId);
    } catch (err) {
        console.error("[bookmarks] PATCH error:", err);
    }
}

/** Add a bookmark — writes to API then refetches */
export async function addBookmark(accountId: number, car: BookmarkCar) {
    // Optimistic local update
    const current = useBookmarkStore.getState().bookmarks;
    if (current.some((b) => b.vin === car.vin)) return;
    useBookmarkStore.getState().setBookmarks([...current, car]);
    // Push full list to API
    const vins = [...current, car].map((b) => ({ vin: b.vin }));
    await saveAndRefresh(accountId, vins);
}

/** Remove a bookmark — writes to API then refetches */
export async function removeBookmark(accountId: number, vin: string) {
    // Optimistic local update
    const current = useBookmarkStore.getState().bookmarks;
    useBookmarkStore.getState().setBookmarks(current.filter((b) => b.vin !== vin));
    // Push full list to API
    const vins = current.filter((b) => b.vin !== vin).map((b) => ({ vin: b.vin }));
    await saveAndRefresh(accountId, vins);
}

/** Clear all bookmarks — writes to API then refetches */
export async function clearBookmarks(accountId: number) {
    useBookmarkStore.getState().setBookmarks([]);
    await saveAndRefresh(accountId, []);
}

/** Toggle a bookmark — writes to API then refetches */
export async function toggleBookmark(accountId: number, car: BookmarkCar) {
    const exists = useBookmarkStore.getState().isBookmarked(car.vin);
    if (exists) {
        await removeBookmark(accountId, car.vin);
    } else {
        await addBookmark(accountId, car);
    }
}
