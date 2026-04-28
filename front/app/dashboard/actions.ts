import { browserApi } from "@/app/lib/fcr-client";
import type { ReservationPatch } from "@/app/lib/fcr-client";

// ── Users ─────────────────────────────────────────────────────────────────────

export const getUserById = (userId: string | number) =>
    browserApi.users.getById(userId);

export const updateUser = (userId: string | number, patch: Record<string, unknown>) =>
    browserApi.users.update(userId, patch);

// ── Accounts ──────────────────────────────────────────────────────────────────

export const getAccountById = (acctId: number, opts?: { parseFullObjects?: boolean }) =>
    browserApi.accounts.getById(acctId, opts);

// ── Cars ──────────────────────────────────────────────────────────────────────

export const getCarById = (vin: string) =>
    browserApi.cars.getById(vin);

// ── Reservations ──────────────────────────────────────────────────────────────

export const deleteReservation = (reservationId: string | number) =>
    browserApi.reservations.delete(reservationId);

export const updateReservation = (reservationId: string | number, patch: ReservationPatch | Record<string, unknown>) =>
    browserApi.reservations.update(reservationId, patch);

// ── Reservations (user-facing, fully hydrated) ────────────────────────────────

export async function getReservationPage(
    params: Record<string, string>,
): Promise<{ items: Record<string, unknown>[]; totalPages: number; totalItems: number }> {
    const qp = new URLSearchParams({ parseFullObjects: "true", ...params });
    try {
        const res = await fetch(`/api/reservations?${qp}`, { cache: "no-store" });
        if (!res.ok) return { items: [], totalPages: 1, totalItems: 0 };
        const data = await res.json();
        const items: Record<string, unknown>[] = Array.isArray(data)
            ? data
            : Array.isArray(data?.data) ? data.data : [];
        return {
            items,
            totalPages: (data?.totalPages as number) ?? 1,
            totalItems: (data?.totalItems as number) ?? items.length,
        };
    } catch {
        return { items: [], totalPages: 1, totalItems: 0 };
    }
}

// ── Reviews ───────────────────────────────────────────────────────────────────

export const getReviewsForAccount = (acctId: number, opts?: { objectsPerPage?: number }) =>
    browserApi.reviews.getForAccount(acctId, opts);

// ── Payments ──────────────────────────────────────────────────────────────────

export async function getPaymentsPage(userId: number, page: number, pageSize = 10): Promise<{
    payments: Record<string, unknown>[];
    totalPages: number;
    totalItems: number;
}> {
    try {
        const qp = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
        const res = await fetch(`/api/users/${userId}/payments?${qp}`, { cache: "no-store" });
        if (!res.ok) return { payments: [], totalPages: 1, totalItems: 0 };
        const data = await res.json();
        return {
            payments: Array.isArray(data?.data) ? data.data : [],
            totalPages: (data?.totalPages as number) ?? 1,
            totalItems: (data?.totalItems as number) ?? 0,
        };
    } catch {
        return { payments: [], totalPages: 1, totalItems: 0 };
    }
}

export async function getPaymentsForUser(userId: number, pageSize = 50): Promise<{
    payments: Record<string, unknown>[];
    totalItems: number;
}> {
    const all: Record<string, unknown>[] = [];
    let page = 1;
    let totalPages = 1;
    let totalItems = 0;
    try {
        while (page <= totalPages) {
            const qp = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
            const res = await fetch(`/api/users/${userId}/payments?${qp}`, { cache: "no-store" });
            if (!res.ok) break;
            const data = await res.json();
            const items: Record<string, unknown>[] = Array.isArray(data?.data) ? data.data : [];
            all.push(...items);
            totalPages = (data?.totalPages as number) ?? 1;
            totalItems = (data?.totalItems as number) ?? all.length;
            page++;
        }
    } catch { /* swallow */ }
    return { payments: all, totalItems };
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const sendMagicLink = (email: string) =>
    browserApi.auth.sendMagicLink(email);
