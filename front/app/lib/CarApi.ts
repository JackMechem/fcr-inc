import { Car, CarPages } from "../types/CarTypes";

const getAllCars = async ({
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
		`${process.env.API_BASE_URL}/cars?${pageSize ? "pageSize=" + pageSize + "&" : ""}${page ? "page=" + page + "&" : ""}`,
		{
			next: { revalidate: Number(process.env.REVALIDATE_SECONDS) },
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

const getCar = async (_vin: string): Promise<Car> => {
	const res: Response = await fetch(
		`${process.env.API_BASE_URL}/cars/${_vin}`,
		{
			next: { revalidate: Number(process.env.REVALIDATE_SECONDS) },
		},
	);

	if (!res.ok) {
		throw new Error(`Failed to fetch data from ${res.url}`);
	}

	const car: Promise<Car> = res.json();
	return car;
};

export { getAllCars, getCar };
