import { ReservationPages } from "../types/ReservationTypes";

export const getAllReservations = async ({
    page,
    pageSize,
}: {
    page?: number;
    pageSize?: number;
} = {}): Promise<ReservationPages> => {
    const params = new URLSearchParams();
    if (page) params.set("page", String(page));
    if (pageSize) params.set("pageSize", String(pageSize));

    const res = await fetch(`/api/reservations?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch reservations`);
    return res.json();
};
