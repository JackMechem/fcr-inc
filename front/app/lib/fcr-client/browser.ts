/**
 * Browser-side FCR API client.
 * All requests go through the Next.js /api/ proxy routes — no backend URLs or
 * API keys are needed here. Safe to import from any client component.
 *
 * Usage:
 *   import { browserApi } from '@/app/lib/fcr-client';
 *   const cars = await browserApi.cars.getFiltered({ pageSize: 20 });
 */

import type {
    Car,
    CarPages,
    CarApiParams,
    ReservationPages,
    ReservationPatch,
    UserReservationRaw,
    Review,
    ReviewPages,
    Account,
    AccountPages,
    User,
    UserPages,
} from "./types";
import { buildQuery, parseResponse } from "./core";

// ── Helpers ───────────────────────────────────────────────────────────────────

async function apiThrow(res: Response): Promise<never> {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text);
}

async function expectOk(res: Response): Promise<void> {
    if (!res.ok) await apiThrow(res);
}

/** Like parseResponse but handles empty/no-content bodies without throwing. */
async function safeJson(res: Response): Promise<unknown> {
    if (!res.ok) await apiThrow(res);
    const text = await res.text();
    return text ? JSON.parse(text) : null;
}

// ── Domain: cars ──────────────────────────────────────────────────────────────

const cars = {
    /** Search suggestions for nav autocomplete. */
    async suggest(
        searchText: string,
        pageSize = 6,
    ): Promise<{ vin: string; make: string; model: string }[]> {
        if (!searchText.trim()) return [];
        const qs = buildQuery({ search: searchText, select: "vin,make,model", pageSize });
        try {
            const res = await fetch(`/api/cars?${qs}`);
            if (!res.ok) return [];
            const data = await res.json();
            return data.data ?? [];
        } catch {
            return [];
        }
    },

    /** Paginated + filtered car list. */
    async getFiltered(
        params: CarApiParams | Record<string, string | number | undefined>,
    ): Promise<CarPages> {
        const qs = buildQuery(params as Record<string, string | number | undefined>);
        const res = await fetch(`/api/cars?${qs}`, { cache: "no-store" });
        return parseResponse<CarPages>(res);
    },

    /** Paginated car list with only page + pageSize. */
    async getAll(opts: { page?: number; pageSize?: number } = {}): Promise<CarPages> {
        const qs = buildQuery({ page: opts.page, pageSize: opts.pageSize });
        const res = await fetch(`/api/cars${qs ? `?${qs}` : ""}`, { cache: "no-store" });
        return parseResponse<CarPages>(res);
    },

    /** Single car by VIN. */
    async getById(vin: string): Promise<Car> {
        const res = await fetch(`/api/cars/${vin}`, { cache: "no-store" });
        return parseResponse<Car>(res);
    },

    /** Create a new car. */
    async add(car: Car): Promise<string> {
        const res = await fetch("/api/cars", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(car),
        });
        if (!res.ok) await apiThrow(res);
        return res.text();
    },

    /** Update car fields. */
    async update(car: Car): Promise<string> {
        const res = await fetch(`/api/cars/${car.vin}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(car),
        });
        if (!res.ok) await apiThrow(res);
        return res.text();
    },

    /** Update only the car's status. */
    async updateStatus(vin: string, carStatus: string): Promise<string> {
        const res = await fetch(`/api/cars/${vin}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ carStatus }),
        });
        if (!res.ok) await apiThrow(res);
        return res.text();
    },

    /** Delete a car. */
    async delete(vin: string): Promise<string> {
        const res = await fetch(`/api/cars/${vin}`, { method: "DELETE" });
        if (!res.ok) await apiThrow(res);
        return res.text();
    },
};

// ── Domain: accounts ──────────────────────────────────────────────────────────

const accounts = {
    /** Paginated account list with optional search + sort. */
    async getAll(opts: {
        page?: number;
        pageSize?: number;
        search?: string;
        sortBy?: string | null;
        sortDir?: "asc" | "desc";
    } = {}): Promise<AccountPages> {
        const qs = buildQuery({
            page: opts.page,
            pageSize: opts.pageSize,
            search: opts.search,
            sortBy: opts.sortBy ?? undefined,
            sortDir: opts.sortDir,
        });
        const res = await fetch(`/api/accounts${qs ? `?${qs}` : ""}`, { cache: "no-store" });
        return parseResponse<AccountPages>(res);
    },

    /** Single account by ID, with optional full-object hydration. */
    async getById(
        acctId: number,
        opts?: { parseFullObjects?: boolean },
    ): Promise<Record<string, unknown>> {
        const qs = buildQuery(opts?.parseFullObjects ? { parseFullObjects: "true" } : {});
        const res = await fetch(`/api/accounts/${acctId}${qs ? `?${qs}` : ""}`, {
            cache: "no-store",
        });
        return parseResponse<Record<string, unknown>>(res);
    },

    /** Create a new account (admin). */
    async create(data: { name: string; email: string; role: string }): Promise<unknown> {
        const res = await fetch("/api/accounts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        return safeJson(res);
    },

    /** Update account fields. */
    async update(
        acctId: number,
        patch: Partial<Pick<Account, "name" | "email" | "role" | "dateEmailConfirmed">>,
    ): Promise<void> {
        const res = await fetch(`/api/accounts/${acctId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch),
        });
        await expectOk(res);
    },

    /** Delete an account. */
    async delete(acctId: number): Promise<void> {
        const res = await fetch(`/api/accounts/${acctId}`, { method: "DELETE" });
        await expectOk(res);
    },
};

// ── Domain: users ─────────────────────────────────────────────────────────────

const users = {
    /** Paginated user list. */
    async getAll(opts: {
        page?: number;
        pageSize?: number;
        sortBy?: string | null;
        sortDir?: "asc" | "desc";
    } = {}): Promise<UserPages> {
        const qs = buildQuery({
            page: opts.page,
            pageSize: opts.pageSize,
            sortBy: opts.sortBy ?? undefined,
            sortDir: opts.sortDir,
        });
        const res = await fetch(`/api/users${qs ? `?${qs}` : ""}`, { cache: "no-store" });
        return parseResponse<UserPages>(res);
    },

    async getById(userId: string | number): Promise<Record<string, unknown> | null> {
        try {
            const res = await fetch(`/api/users/${userId}`);
            return res.ok ? res.json() : null;
        } catch {
            return null;
        }
    },

    async create(data: Record<string, unknown>): Promise<unknown> {
        const res = await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        return safeJson(res);
    },

    async update(
        userId: string | number,
        patch: Record<string, unknown>,
    ): Promise<Record<string, unknown> | null> {
        try {
            const res = await fetch(`/api/users/${userId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(patch),
            });
            return res.ok ? res.json() : null;
        } catch {
            return null;
        }
    },

    async delete(userId: number): Promise<void> {
        const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
        await expectOk(res);
    },
};

// ── Domain: reservations ──────────────────────────────────────────────────────

const reservations = {
    /** Paginated reservation list (admin). */
    async getAll(opts: {
        page?: number;
        pageSize?: number;
        sortBy?: string | null;
        sortDir?: "asc" | "desc";
    } = {}): Promise<ReservationPages> {
        const qs = buildQuery({
            page: opts.page,
            pageSize: opts.pageSize,
            sortBy: opts.sortBy ?? undefined,
            sortDir: opts.sortDir,
        });
        const res = await fetch(`/api/reservations${qs ? `?${qs}` : ""}`, {
            cache: "no-store",
        });
        if (!res.ok) {
            const body = await res.text();
            throw new Error(`Failed to fetch reservations (${res.status}): ${body}`);
        }
        return res.json();
    },

    /** User's existing reservations (for date-range conflict detection). */
    async listForUser(userId: string | number): Promise<UserReservationRaw[]> {
        try {
            const res = await fetch(
                `/api/reservations?userId=${encodeURIComponent(userId)}`,
            );
            if (!res.ok) return [];
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        } catch {
            return [];
        }
    },

    /** Create a reservation (admin). */
    async create(data: {
        car: string;
        user: number;
        pickUpTime: number;
        dropOffTime: number;
    }): Promise<unknown> {
        const res = await fetch("/api/reservations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        return safeJson(res);
    },

    /** Update a reservation. */
    async update(
        reservationId: string | number,
        patch: ReservationPatch | Record<string, unknown>,
    ): Promise<unknown> {
        const res = await fetch(`/api/reservations/${reservationId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch),
        });
        if (!res.ok) {
            const text = await res.text().catch(() => res.statusText);
            throw new Error(text);
        }
        const text = await res.text();
        return text ? JSON.parse(text) : null;
    },

    /** Delete a reservation. */
    async delete(reservationId: string | number): Promise<void> {
        const res = await fetch(`/api/reservations/${reservationId}`, {
            method: "DELETE",
        });
        if (!res.ok) {
            const body = await res.text();
            throw new Error(`Delete failed (${res.status}): ${body}`);
        }
    },
};

// ── Domain: reviews ───────────────────────────────────────────────────────────

const reviews = {
    /** Paginated review list (admin). */
    async getAll(opts: { page?: number; pageSize?: number } = {}): Promise<ReviewPages> {
        const qs = buildQuery({ page: opts.page, pageSize: opts.pageSize });
        const res = await fetch(`/api/reviews${qs ? `?${qs}` : ""}`, { cache: "no-store" });
        return parseResponse<ReviewPages>(res);
    },

    /** Reviews for a specific account. */
    async getForAccount(
        acctId: number,
        opts?: { objectsPerPage?: number },
    ): Promise<Review[]> {
        const qs = buildQuery({
            account: acctId,
            "objects-per-page": opts?.objectsPerPage ?? 500,
        });
        try {
            const res = await fetch(`/api/reviews?${qs}`);
            if (!res.ok) return [];
            const data = await res.json();
            return data?.data ?? [];
        } catch {
            return [];
        }
    },

    /** Create a review (admin). */
    async create(data: {
        car: string;
        account: number;
        stars: number;
        title: string;
        bodyOfText: string;
        rentalDuration: number;
        publishedDate: number;
    }): Promise<unknown> {
        const res = await fetch("/api/reviews", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        return safeJson(res);
    },

    /** Update a review (admin/staff). */
    async update(reviewId: number, patch: Record<string, unknown>): Promise<unknown> {
        const res = await fetch(`/api/reviews/${reviewId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch),
        });
        return safeJson(res);
    },

    /** Delete a review. */
    async delete(reviewId: number): Promise<void> {
        const res = await fetch(`/api/reviews/${reviewId}`, { method: "DELETE" });
        await expectOk(res);
    },
};

// ── Domain: bookmarks ─────────────────────────────────────────────────────────

const bookmarks = {
    /** Get bookmarked cars for an account. */
    async get(accountId: number): Promise<Record<string, unknown>> {
        const res = await fetch(`/api/accounts/${accountId}/bookmarks`);
        return parseResponse<Record<string, unknown>>(res);
    },

    /** Save a new VIN list to the account's bookmarks. */
    async update(accountId: number, vins: { vin: string }[]): Promise<void> {
        const res = await fetch(`/api/accounts/${accountId}/bookmarks`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bookmarkedCars: vins }),
        });
        await expectOk(res);
    },
};

// ── Domain: auth ──────────────────────────────────────────────────────────────

const auth = {
    /** Validate basic credentials. Returns the HTTP status code. */
    async validateCredentials(username: string, password: string): Promise<number> {
        const res = await fetch("/api/auth/validate", {
            headers: { Authorization: `Basic ${btoa(`${username}:${password}`)}` },
        });
        return res.status;
    },

    /** Send a magic login link to an email address. */
    async sendMagicLink(email: string): Promise<void> {
        await fetch("/api/auth/magic-link", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });
    },

    /** Register a new account + user. */
    async register(data: Record<string, unknown>): Promise<Response> {
        return fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
            signal: AbortSignal.timeout(10000),
        });
    },

    /** Check whether a full account exists for the given email. */
    async checkAccount(email: string): Promise<{ exists: boolean }> {
        const res = await fetch(
            `/api/auth/check-account?email=${encodeURIComponent(email)}`,
            { cache: "no-store" },
        );
        return res.ok ? res.json() : { exists: false };
    },

    /** Look up a user record by email (guest checkout). */
    async userLookup(email: string): Promise<Record<string, unknown> | null> {
        const res = await fetch(
            `/api/user-lookup?email=${encodeURIComponent(email)}`,
            { cache: "no-store" },
        );
        if (!res.ok) return null;
        const raw = await res.json();
        return (
            raw?.data?.[0] ??
            raw?.content?.[0] ??
            raw?.users?.[0] ??
            (Array.isArray(raw) ? raw[0] : null) ??
            ((raw?.userId ?? raw?.id) ? raw : null) ??
            null
        );
    },
};

// ── Domain: payment ───────────────────────────────────────────────────────────

const payment = {
    /** Create a Stripe payment intent for the current cart. */
    async createIntent(data: {
        userInfo: Record<string, unknown> | null;
        cars: { vin: string; pickUpTime: string; dropOffTime: string }[];
    }): Promise<{ clientSecret: string; publishableKey: string }> {
        const res = await fetch("/api/payment-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        return parseResponse(res);
    },
};

// ── Export ────────────────────────────────────────────────────────────────────

export const browserApi = {
    cars,
    accounts,
    users,
    reservations,
    reviews,
    bookmarks,
    auth,
    payment,
};

// Re-export types so callers can do: import { browserApi, type User } from '@/app/lib/fcr-client'
export type {
    Car,
    CarPages,
    CarApiParams,
    ReservationPages,
    ReservationPatch,
    UserReservationRaw,
    Review,
    ReviewPages,
    Account,
    AccountPages,
    User,
    UserPages,
};
