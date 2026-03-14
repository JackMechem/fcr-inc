import { Car, CarPages } from "../types/CarTypes";

export const getAllCars = async ({
	page,
	pageSize,
}: {
	page?: number;
	pageSize?: number;
}): Promise<CarPages> => {
	const username = "jim";
	const password = "intentionallyInsecurePassword#3";

	const token = btoa(`${username}:${password}`);

	const res: Response = await fetch(
		`${process.env.NEXT_PUBLIC_API_BASE_URL}/cars?${pageSize ? "pageSize=" + pageSize + "&" : ""}${page ? "page=" + page + "&" : ""}`,
		{
			next: { revalidate: false },
			headers: {
				Authorization: `Basic ${token}`,
				"Content-Type": "application/json",
			},
		},
	);

	if (!res.ok) {
		throw new Error(await res.text());
	}

	const cars: Promise<CarPages> = res.json();
	return cars;
};

export const addCar = async (car: Car, username: string, password: string) => {

	const token = btoa(`${username}:${password}`);

	const res: Response = await fetch(
		`${process.env.NEXT_PUBLIC_API_BASE_URL}/cars`,
		{
			next: { revalidate: Number(process.env.NEXT_PUBLIC_REVALIDATE_SECONDS) },
			method: "POST",
            body: JSON.stringify(car),
			headers: {
				Authorization: `Basic ${token}`,
				"Content-Type": "application/json",
			},
		},
	);

	if (!res.ok) {
		throw new Error(await res.text());
	}

	return res.text();
};


export const deleteCar = async (vin: string, username: string, password: string) => {

	const token = btoa(`${username}:${password}`);

	const res: Response = await fetch(
		`${process.env.NEXT_PUBLIC_API_BASE_URL}/cars/${vin}`,
		{
			next: { revalidate: Number(process.env.NEXT_PUBLIC_REVALIDATE_SECONDS) },
			method: "DELETE",
			headers: {
				Authorization: `Basic ${token}`,
				"Content-Type": "application/json",
			},
		},
	);

	if (!res.ok) {
		throw new Error(await res.text());
	}

	return res.text();
};
