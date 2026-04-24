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

// ── Reviews ───────────────────────────────────────────────────────────────────

export const getReviewsForAccount = (acctId: number, opts?: { objectsPerPage?: number }) =>
    browserApi.reviews.getForAccount(acctId, opts);

// ── Auth ──────────────────────────────────────────────────────────────────────

export const sendMagicLink = (email: string) =>
    browserApi.auth.sendMagicLink(email);
