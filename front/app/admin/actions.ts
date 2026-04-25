import { browserApi } from "@/app/lib/fcr-client";
import type { Car, Account, CarApiParams } from "@/app/lib/fcr-client";

// ── Cars ──────────────────────────────────────────────────────────────────────

export const getAllCars = (opts: { pageSize?: number } = {}) =>
    browserApi.cars.getAll(opts);

export const getCarsFiltered = (params: CarApiParams | Record<string, string | number | undefined>) =>
    browserApi.cars.getFiltered(params);

export const getCarById = (vin: string) =>
    browserApi.cars.getById(vin);

export const addCar = (car: Car) =>
    browserApi.cars.add(car);

export const updateCar = (car: Car) =>
    browserApi.cars.update(car);

export const deleteCar = (vin: string) =>
    browserApi.cars.delete(vin);

// ── Accounts ──────────────────────────────────────────────────────────────────

export const getAccounts = (opts: {
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: string | null;
    sortDir?: "asc" | "desc";
} = {}) => browserApi.accounts.getAll(opts);

export const createAccount = (data: { name: string; email: string; role: string }) =>
    browserApi.accounts.create(data);

export const updateAccount = (
    acctId: number,
    patch: Partial<Pick<Account, "name" | "email" | "role" | "dateEmailConfirmed">>,
) => browserApi.accounts.update(acctId, patch);

export const deleteAccount = (acctId: number) =>
    browserApi.accounts.delete(acctId);

// ── Users ─────────────────────────────────────────────────────────────────────

export const getUsers = (opts: {
    page?: number;
    pageSize?: number;
    sortBy?: string | null;
    sortDir?: "asc" | "desc";
} = {}) => browserApi.users.getAll(opts);

export const createUser = (data: Record<string, unknown>) =>
    browserApi.users.create(data);

export const updateUser = (userId: string | number, patch: Record<string, unknown>) =>
    browserApi.users.update(userId, patch);

export const deleteUser = (userId: number) =>
    browserApi.users.delete(userId);

// ── Reservations ──────────────────────────────────────────────────────────────

export const getReservations = (opts: {
    page?: number;
    pageSize?: number;
    sortBy?: string | null;
    sortDir?: "asc" | "desc";
} = {}) => browserApi.reservations.getAll(opts);

export const createReservation = (data: { car: string; user: number; pickUpTime: number; dropOffTime: number; payments?: string[] }) =>
    browserApi.reservations.create(data);

export const updateReservation = (reservationId: string | number, patch: Record<string, unknown>) =>
    browserApi.reservations.update(reservationId, patch);

export const deleteReservation = (reservationId: string | number) =>
    browserApi.reservations.delete(reservationId);

// ── Payments ──────────────────────────────────────────────────────────────────

export const getPaymentsForReservation = async (reservationId: number) => {
    const res = await fetch(`/api/payments?pageSize=500`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch payments (${res.status})`);
    const data = await res.json();
    const all: import("@/app/types/ReservationTypes").Payment[] = data?.data ?? data ?? [];
    return all.filter((p) => {
        const reservations = (p as unknown as Record<string, unknown>).reservations;
        if (!Array.isArray(reservations)) return false;
        return reservations.some((r) =>
            typeof r === "object" && r !== null
                ? (r as Record<string, unknown>).reservationId === reservationId
                : Number(r) === reservationId
        );
    });
};

export const createPayment = (data: {
    paymentId: string;
    totalAmount: number;
    amountPaid: number;
    date: string;
    paymentType: string;
    reservations: number[];
}) => fetch("/api/payments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
}).then(async (res) => {
    if (!res.ok) throw new Error(`Create payment failed (${res.status}): ${await res.text()}`);
});

export const updatePayment = (paymentId: string, patch: Record<string, unknown>) =>
    fetch(`/api/payments/${encodeURIComponent(paymentId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
    }).then(async (res) => {
        if (!res.ok) throw new Error(`Update payment failed (${res.status}): ${await res.text()}`);
    });

export const deletePayment = (paymentId: string) =>
    fetch(`/api/payments/${encodeURIComponent(paymentId)}`, { method: "DELETE" })
        .then(async (res) => {
            if (!res.ok && res.status !== 204) throw new Error(`Delete payment failed (${res.status})`);
        });

// ── Reviews ───────────────────────────────────────────────────────────────────

export const getReviews = (opts: { page?: number; pageSize?: number } = {}) =>
    browserApi.reviews.getAll(opts);

export const createReview = (data: { car: string; account: number; stars: number; title: string; bodyOfText: string; rentalDuration: number; publishedDate: number }) =>
    browserApi.reviews.create(data);

export const updateReview = (reviewId: number, patch: Record<string, unknown>) =>
    browserApi.reviews.update(reviewId, patch);

export const deleteReview = (reviewId: number) =>
    browserApi.reviews.delete(reviewId);

// ── Bookmarks (reads from accounts) ──────────────────────────────────────────

export const getAccountsWithBookmarks = (opts: { page?: number; pageSize?: number } = {}) =>
    browserApi.accounts.getAll(opts);
