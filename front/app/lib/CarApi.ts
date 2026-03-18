import { Car, CarPages } from "../types/CarTypes";

const username = "jim";
const password = "intentionallyInsecurePassword#3";
const token = btoa(`${username}:${password}`);

const defaultHeaders = {
	Authorization: `Basic ${token}`,
	"Content-Type": "application/json",
};

const defaultNext = {
	next: { revalidate: Number(process.env.REVALIDATE_SECONDS) },
};

type FilteredCarsParams = {
	page?: number;
	pageSize?: number;
	select?: string;
	sortBy?: string;
	sortDir?: "asc" | "desc";
	make?: string;
	model?: string;
	modelYear?: number;
	minModelYear?: number;
	maxModelYear?: number;
	transmission?: string;
	drivetrain?: string;
	engineLayout?: string;
	fuel?: string;
	bodyType?: string;
	roofType?: string;
	vehicleClass?: string;
};

export const getFilteredCars = async ({
	page,
	pageSize,
	select,
	sortBy,
	sortDir,
	make,
	model,
	modelYear,
    minModelYear,
    maxModelYear,
	transmission,
	drivetrain,
	engineLayout,
	fuel,
	bodyType,
	roofType,
	vehicleClass,
}: FilteredCarsParams): Promise<CarPages> => {
	const params = new URLSearchParams();
	if (page != null) params.set("page", String(page));
	if (pageSize != null) params.set("pageSize", String(pageSize));
	if (select != null) params.set("select", select);
	if (sortBy != null) params.set("sortBy", sortBy);
	if (sortDir != null) params.set("sortDir", sortDir);
	if (make != null) params.set("make", make);
	if (model != null) params.set("model", model);
	if (modelYear != null) params.set("modelYear", String(modelYear));
	if (minModelYear != null) params.set("minModelYear", String(minModelYear));
	if (maxModelYear != null) params.set("maxModelYear", String(maxModelYear));
	if (transmission != null) params.set("transmission", transmission);
	if (drivetrain != null) params.set("drivetrain", drivetrain);
	if (engineLayout != null) params.set("engineLayout", engineLayout);
	if (fuel != null) params.set("fuel", fuel);
	if (bodyType != null) params.set("bodyType", bodyType);
	if (roofType != null) params.set("roofType", roofType);
	if (vehicleClass != null) params.set("vehicleClass", vehicleClass);

	const res = await fetch(
		`${process.env.API_BASE_URL}/cars?${params.toString()}`,
		{ ...defaultNext, headers: defaultHeaders },
	);
	if (!res.ok) throw new Error(await res.text());
	return res.json();
};

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

export const getCar = async (_vin: string): Promise<Car> => {
	const res = await fetch(`${process.env.API_BASE_URL}/cars/${_vin}`, {
		...defaultNext,
		headers: defaultHeaders,
	});
	if (!res.ok) throw new Error(`Failed to fetch data from ${res.url}`);
	return res.json();
};

