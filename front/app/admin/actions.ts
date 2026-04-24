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

export const createUser = (data: { firstName: string; lastName: string; email: string; phoneNumber?: string }) =>
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

export const createReservation = (data: { car: string; user: number; pickUpTime: number; dropOffTime: number }) =>
    browserApi.reservations.create(data);

export const updateReservation = (reservationId: string | number, patch: Record<string, unknown>) =>
    browserApi.reservations.update(reservationId, patch);

export const deleteReservation = (reservationId: string | number) =>
    browserApi.reservations.delete(reservationId);

// ── Reviews ───────────────────────────────────────────────────────────────────

export const getReviews = (opts: { page?: number; pageSize?: number } = {}) =>
    browserApi.reviews.getAll(opts);

export const createReview = (data: { car: string; account: number; stars: number; title: string; bodyOfText: string; rentalDuration: number }) =>
    browserApi.reviews.create(data);

export const deleteReview = (reviewId: number) =>
    browserApi.reviews.delete(reviewId);

// ── Bookmarks (reads from accounts) ──────────────────────────────────────────

export const getAccountsWithBookmarks = (opts: { page?: number; pageSize?: number } = {}) =>
    browserApi.accounts.getAll(opts);
