import { Car } from "../types/CarTypes";

const getAllCars = async (): Promise<Car[]> => {
	const res: Response = await fetch(`${process.env.API_BASE_URL}/cars`, {
		next: { revalidate: Number(process.env.REVALIDATE_SECONDS) },
	});

	if (!res.ok) {
		throw new Error(`Failed to fetch data from ${res.url}`);
	}

	const cars: Promise<Car[]> = res.json();
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
