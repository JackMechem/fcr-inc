import { ReservationPages } from "../types/ReservationTypes";

const defaultNext = {
	next: { revalidate: Number(process.env.REVALIDATE_SECONDS) },
};

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

	const res = await fetch(
		`${process.env.NEXT_PUBLIC_API_BASE_URL}/reservations?${params.toString()}`,
		{ ...defaultNext },
	);
	if (!res.ok) throw new Error(`Failed to fetch reservations from ${res.url}`);
	return res.json();
};
