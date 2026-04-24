"use server";
import { serverApi } from "@/app/lib/fcr-client/server";
import { getSessionCookies } from "@/app/lib/serverAuth";
import type { CarApiParams, CarPages } from "@/app/lib/fcr-client";

export async function fetchCarsPage(params: CarApiParams): Promise<CarPages> {
    return serverApi.cars.getFiltered(params);
}

export async function getFilterBarData() {
    const [enums, makes] = await Promise.all([
        serverApi.enums.getAll(),
        serverApi.cars.getMakes(),
    ]);
    return { enums, makes };
}

export async function getUserReservations(userId: string | number) {
    const { sessionToken } = await getSessionCookies();
    if (!sessionToken) return [];
    const data = await serverApi.reservations.list(sessionToken, {
        userId: Number(userId),
        pageSize: 500,
    });
    return data as { car?: { vin: string } | null; pickUpTime: number | string; dropOffTime: number | string }[];
}
