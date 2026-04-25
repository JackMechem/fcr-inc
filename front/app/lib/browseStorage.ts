// Set to true by BrowseParamsSync when it's about to call router.replace() to
// restore saved params. InfiniteCarList reads this flag and skips its initial
// fetch so there's only one request once the redirect completes.
let _redirectPending = false;
export const setBrowseRedirectPending = (v: boolean) => { _redirectPending = v; };
export const isBrowseRedirectPending = () => _redirectPending;

// ── Browse scroll / list restoration ─────────────────────────────────────────

const SCROLL_KEY = "fcr_browse_scroll";
const SCROLL_TTL_MS = 5 * 60 * 1000; // 5 minutes

export interface BrowseScrollState {
    scrollY: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cars: any[];
    page: number;
    hasMore: boolean;
    paramsKey: string;
    timestamp: number;
}

export function saveBrowseScrollState(state: Omit<BrowseScrollState, "timestamp">): void {
    if (typeof sessionStorage === "undefined") return;
    try {
        sessionStorage.setItem(SCROLL_KEY, JSON.stringify({ ...state, timestamp: Date.now() }));
    } catch { /* quota exceeded — silently skip */ }
}

export function getBrowseScrollState(paramsKey: string): BrowseScrollState | null {
    if (typeof sessionStorage === "undefined") return null;
    try {
        const raw = sessionStorage.getItem(SCROLL_KEY);
        if (!raw) return null;
        const data: BrowseScrollState = JSON.parse(raw);
        if (data.paramsKey !== paramsKey) return null;
        if (Date.now() - data.timestamp > SCROLL_TTL_MS) {
            sessionStorage.removeItem(SCROLL_KEY);
            return null;
        }
        return data;
    } catch { return null; }
}

export function clearBrowseScrollState(): void {
    if (typeof sessionStorage === "undefined") return;
    sessionStorage.removeItem(SCROLL_KEY);
}

const DATES_KEY = "fcr_browse_dates";
const FILTERS_KEY = "fcr_browse_filters";

const DATE_FIELDS = new Set(["fromDate", "untilDate"]);
const SKIP_FIELDS = new Set(["page", "pageSize"]);
// Fields that don't count as "explicit filter params" when deciding whether to restore localStorage filters
const NON_FILTER_FIELDS = new Set([
    "page", "pageSize", "sortBy", "sortDir", "layout", "search", "fromDate", "untilDate",
]);

export function saveBrowseState(searchParams: URLSearchParams): void {
    if (typeof localStorage === "undefined") return;
    const dates = new URLSearchParams();
    const filters = new URLSearchParams();
    searchParams.forEach((v, k) => {
        if (SKIP_FIELDS.has(k)) return;
        if (DATE_FIELDS.has(k)) dates.set(k, v);
        else filters.set(k, v);
    });
    localStorage.setItem(DATES_KEY, dates.toString());
    localStorage.setItem(FILTERS_KEY, filters.toString());
}

export function saveDates(from: string | undefined, until: string | undefined): void {
    if (typeof localStorage === "undefined") return;
    const dates = new URLSearchParams();
    if (from) dates.set("fromDate", from);
    if (until) dates.set("untilDate", until);
    localStorage.setItem(DATES_KEY, dates.toString());
}

export function getStoredDates(): URLSearchParams {
    if (typeof localStorage === "undefined") return new URLSearchParams();
    return new URLSearchParams(localStorage.getItem(DATES_KEY) ?? "");
}

export function getStoredFilters(): URLSearchParams {
    if (typeof localStorage === "undefined") return new URLSearchParams();
    return new URLSearchParams(localStorage.getItem(FILTERS_KEY) ?? "");
}

/** Returns true if the URL has any real filter params (make, price, etc.) — not just dates/sort/layout. */
export function hasExplicitFilterParams(searchParams: URLSearchParams): boolean {
    return [...searchParams.keys()].some((k) => !NON_FILTER_FIELDS.has(k));
}
