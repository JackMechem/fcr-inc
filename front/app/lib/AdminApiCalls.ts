import { Car, CarPages } from "../types/CarTypes";

// ── Account types ──────────────────────────────────────────────────────────────

export type AccountRole = "CUSTOMER" | "STAFF" | "ADMIN";

export interface Account {
    acctId: number;
    name: string;
    email: string;
    dateCreated: string;
    dateEmailConfirmed: string | null;
    user: number | null;
    role: AccountRole;
}

export interface AccountPages {
    data: Account[];
    currentPage: number;
    totalPages: number;
    totalItems: number;
}

// ── User types ─────────────────────────────────────────────────────────────────

export interface UserAddress {
    buildingNumber: string;
    streetName: string;
    city: string;
    state: string;
    zipCode: string;
}

export interface UserDriversLicense {
    driversLicense: string;
    state: string;
    expirationDate: number;
    dateOfBirth: number;
}

export interface User {
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    dateCreated: string;
    address: UserAddress;
    driversLicense: UserDriversLicense;
    reservations: number[];
    reviews: number[];
}

export interface UserPages {
    data: User[];
    currentPage: number;
    totalPages: number;
    totalItems: number;
}

export const getAllCars = async ({
    page,
    pageSize,
}: {
    page?: number;
    pageSize?: number;
} = {}): Promise<CarPages> => {
    const params = new URLSearchParams();
    if (page) params.set("page", String(page));
    if (pageSize) params.set("pageSize", String(pageSize));

    const res = await fetch(`/api/cars?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const getFilteredCarsAdmin = async (params: Record<string, string | number | undefined>): Promise<CarPages> => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        if (v != null) qs.set(k, String(v));
    }
    const res = await fetch(`/api/cars?${qs.toString()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const getCarAdmin = async (vin: string): Promise<Car> => {
    const res = await fetch(`/api/cars/${vin}`, { cache: "no-store" });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const addCar = async (car: Car) => {
    const res = await fetch("/api/cars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(car),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.text();
};

export const editCar = async (car: Car) => {
    const res = await fetch(`/api/cars/${car.vin}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(car),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.text();
};

export const deleteCar = async (vin: string) => {
    const res = await fetch(`/api/cars/${vin}`, { method: "DELETE" });
    if (!res.ok) throw new Error(await res.text());
    return res.text();
};

// ── Account API calls ──────────────────────────────────────────────────────────

export const getAllAccounts = async ({
    page,
    pageSize,
    search,
}: {
    page?: number;
    pageSize?: number;
    search?: string;
} = {}): Promise<AccountPages> => {
    const params = new URLSearchParams();
    if (page) params.set("page", String(page));
    if (pageSize) params.set("pageSize", String(pageSize));
    if (search) params.set("search", search);

    const res = await fetch(`/api/accounts?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const updateAccount = async (
    acctId: number,
    patch: Partial<Pick<Account, "name" | "email" | "role" | "dateEmailConfirmed">>,
) => {
    const res = await fetch(`/api/accounts/${acctId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error(await res.text());
};

export const deleteAccount = async (acctId: number) => {
    const res = await fetch(`/api/accounts/${acctId}`, { method: "DELETE" });
    if (!res.ok) throw new Error(await res.text());
};

// ── User API calls ─────────────────────────────────────────────────────────────

export const getAllUsers = async ({
    page,
    pageSize,
}: {
    page?: number;
    pageSize?: number;
} = {}): Promise<UserPages> => {
    const params = new URLSearchParams();
    if (page) params.set("page", String(page));
    if (pageSize) params.set("pageSize", String(pageSize));

    const res = await fetch(`/api/users?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const getUser = async (userId: number): Promise<User> => {
    const res = await fetch(`/api/users/${userId}`, { cache: "no-store" });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const updateUser = async (
    userId: number,
    patch: Partial<Pick<User, "firstName" | "lastName" | "email" | "phoneNumber" | "address" | "driversLicense">>,
) => {
    const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error(await res.text());
};

export const deleteUser = async (userId: number) => {
    const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
    if (!res.ok) throw new Error(await res.text());
};

// ── Reservation admin calls ────────────────────────────────────────────────────

export interface ReservationPatch {
    pickUpTime?: number;   // Unix epoch seconds
    dropOffTime?: number;  // Unix epoch seconds
    car?: string;          // VIN
    user?: number;         // userId
}

export const updateReservation = async (reservationId: number, patch: ReservationPatch) => {
    const res = await fetch(`/api/reservations/${reservationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error(await res.text());
};

export const deleteReservation = async (reservationId: number) => {
    const res = await fetch(`/api/reservations/${reservationId}`, { method: "DELETE" });
    if (!res.ok) {
        const body = await res.text();
        console.error(`[deleteReservation] ${res.status}:`, body);
        throw new Error(`Delete failed (${res.status}): ${body}`);
    }
};
