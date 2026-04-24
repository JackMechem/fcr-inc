/**
 * Server-side FCR API client.
 * Import ONLY from server components, server actions, or API route handlers.
 * Never import from client components — use browserApi instead.
 *
 * Reads from environment variables at call time:
 *   NEXT_PUBLIC_API_BASE_URL  — public/catalogue base URL
 *   API_BASE_URL              — private/admin base URL
 *   API_KEY                   — shared API key
 *   REVALIDATE_SECONDS        — ISR revalidation interval (default: 60)
 *
 * Usage:
 *   import { serverApi } from '@/app/lib/fcr-client/server';
 *   const cars = await serverApi.cars.getFiltered({ pageSize: 20 });
 */

import type { Car, CarPages, CarApiParams, CarEnums, Review } from "./types";
import { buildQuery, parseResponse, type QueryValue } from "./core";

// ── Config helpers ────────────────────────────────────────────────────────────

const publicBase = () => process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const privateBase = () => process.env.API_BASE_URL ?? "";
const revalidateOpts = () => ({
    next: { revalidate: Number(process.env.REVALIDATE_SECONDS ?? 60) },
});

// ── Header builders ───────────────────────────────────────────────────────────

function publicHeaders(): Record<string, string> {
    return {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa("jim:intentionallyInsecurePassword#3")}`,
        ...(process.env.API_KEY ? { "X-API-Key": process.env.API_KEY } : {}),
    };
}

function authedHeaders(sessionToken: string): Record<string, string> {
    return {
        "Content-Type": "application/json",
        ...(process.env.API_KEY ? { "X-API-Key": process.env.API_KEY } : {}),
        Authorization: `Bearer ${sessionToken}`,
    };
}

function apiKeyHeaders(): Record<string, string> {
    return {
        "Content-Type": "application/json",
        ...(process.env.API_KEY ? { "X-API-Key": process.env.API_KEY } : {}),
    };
}

// ── Serializes CarApiParams → query string ────────────────────────────────────
// `availabilityFilter` is intentionally excluded — client-side-only field.

function carParamsQuery(p: CarApiParams): string {
    return buildQuery({
        page: p.page,
        pageSize: p.pageSize,
        select: p.select,
        sortBy: p.sortBy,
        sortDir: p.sortDir,
        make: p.make,
        model: p.model,
        modelYear: p.modelYear,
        minModelYear: p.minModelYear,
        maxModelYear: p.maxModelYear,
        transmission: p.transmission as QueryValue,
        drivetrain: p.drivetrain as QueryValue,
        engineLayout: p.engineLayout as QueryValue,
        fuel: p.fuel as QueryValue,
        bodyType: p.bodyType as QueryValue,
        roofType: p.roofType as QueryValue,
        vehicleClass: p.vehicleClass as QueryValue,
        minHorsepower: p.minHorsepower,
        maxHorsepower: p.maxHorsepower,
        minTorque: p.minTorque,
        maxTorque: p.maxTorque,
        minSeats: p.minSeats,
        maxSeats: p.maxSeats,
        minMpg: p.minMpg,
        maxMpg: p.maxMpg,
        minCylinders: p.minCylinders,
        maxCylinders: p.maxCylinders,
        minGears: p.minGears,
        maxGears: p.maxGears,
        minPricePerDay: p.minPricePerDay,
        maxPricePerDay: p.maxPricePerDay,
        search: p.search,
    });
}

// ── Domain: cars ──────────────────────────────────────────────────────────────

const cars = {
    async getFiltered(params: CarApiParams): Promise<CarPages> {
        const res = await fetch(
            `${publicBase()}/cars?${carParamsQuery(params)}`,
            { ...revalidateOpts(), headers: publicHeaders() },
        );
        return parseResponse<CarPages>(res);
    },

    async getById(vin: string): Promise<Car> {
        const res = await fetch(`${publicBase()}/cars/${vin}`, {
            ...revalidateOpts(),
            headers: publicHeaders(),
        });
        return parseResponse<Car>(res);
    },

    async getMakes(): Promise<string[]> {
        const res = await fetch(`${publicBase()}/cars/makes`, {
            ...revalidateOpts(),
            headers: publicHeaders(),
        });
        return parseResponse<string[]>(res);
    },

    async getAll(opts?: {
        page?: number;
        pageSize?: number;
        sessionToken?: string;
    }): Promise<CarPages> {
        const qs = buildQuery({ page: opts?.page, pageSize: opts?.pageSize });
        const res = await fetch(
            `${privateBase()}/cars${qs ? `?${qs}` : ""}`,
            {
                ...revalidateOpts(),
                headers: opts?.sessionToken
                    ? authedHeaders(opts.sessionToken)
                    : publicHeaders(),
            },
        );
        return parseResponse<CarPages>(res);
    },
};

// ── Domain: enums ─────────────────────────────────────────────────────────────

const enums = {
    async getAll(): Promise<CarEnums> {
        const res = await fetch(`${privateBase()}/enums`, {
            ...revalidateOpts(),
            headers: apiKeyHeaders(),
        });
        return parseResponse<CarEnums>(res);
    },
};

// ── Domain: reservations ──────────────────────────────────────────────────────

const reservations = {
    async list(
        sessionToken: string,
        opts?: {
            pageSize?: number;
            parseFullObjects?: boolean;
            userId?: number;
        },
    ): Promise<unknown[]> {
        const qs = buildQuery({
            pageSize: opts?.pageSize ?? 500,
            ...(opts?.parseFullObjects ? { parseFullObjects: "true" } : {}),
            ...(opts?.userId != null ? { userId: opts.userId } : {}),
        });
        try {
            const res = await fetch(`${privateBase()}/reservations?${qs}`, {
                headers: authedHeaders(sessionToken),
                cache: "no-store",
                signal: AbortSignal.timeout(10000),
            });
            if (!res.ok) return [];
            const data = await res.json();
            return Array.isArray(data) ? data : (data.data ?? []);
        } catch {
            return [];
        }
    },
};

// ── Domain: users ─────────────────────────────────────────────────────────────

const users = {
    async getById(
        userId: number,
        sessionToken: string,
    ): Promise<Record<string, unknown> | null> {
        try {
            const res = await fetch(`${privateBase()}/users/${userId}`, {
                headers: authedHeaders(sessionToken),
                cache: "no-store",
                signal: AbortSignal.timeout(5000),
            });
            return res.ok ? await res.json() : null;
        } catch {
            return null;
        }
    },
};

// ── Domain: accounts ──────────────────────────────────────────────────────────

const accounts = {
    async getById(
        acctId: number,
        sessionToken: string,
        opts?: { parseFullObjects?: boolean },
    ): Promise<Record<string, unknown> | null> {
        const qs = buildQuery(
            opts?.parseFullObjects ? { parseFullObjects: "true" } : {},
        );
        const url = `${privateBase()}/accounts/${acctId}${qs ? `?${qs}` : ""}`;
        try {
            const res = await fetch(url, {
                headers: authedHeaders(sessionToken),
                cache: "no-store",
            });
            return res.ok ? await res.json() : null;
        } catch {
            return null;
        }
    },
};

// ── Domain: reviews ───────────────────────────────────────────────────────────

const reviews = {
    async getForCar(vin: string): Promise<Review[]> {
        const url = `${privateBase()}/reviews?car=${encodeURIComponent(vin)}&objects-per-page=100`;
        try {
            const res = await fetch(url, {
                headers: apiKeyHeaders(),
                cache: "no-store",
                signal: AbortSignal.timeout(5000),
            });
            if (!res.ok) return [];
            const data = await res.json();
            return Array.isArray(data?.data) ? (data.data as Review[]) : [];
        } catch {
            return [];
        }
    },
};

// ── Export ────────────────────────────────────────────────────────────────────

export const serverApi = { cars, enums, reservations, users, accounts, reviews };
