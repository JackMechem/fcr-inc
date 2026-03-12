import { Car } from "../types/CarTypes";

export const getAllCars = async (): Promise<Car[]> => {
	const username = "jim";
	const password = "intentionallyInsecurePassword#3";

	const token = btoa(`${username}:${password}`);

	const res: Response = await fetch(
		`${process.env.NEXT_PUBLIC_API_BASE_URL}/cars?pageSize=0`,
		{
			next: { revalidate: Number(process.env.NEXT_PUBLIC_REVALIDATE_SECONDS) },
			headers: {
				Authorization: `Basic ${token}`,
				"Content-Type": "application/json",
			},
		},
	);

	if (!res.ok) {
		throw new Error(await res.text());
	}

	const cars: Promise<Car[]> = res.json();
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
