import { Car, CarPages, CarApiParams } from "../types/CarTypes";

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

export const getFilteredCars = async (p: CarApiParams): Promise<CarPages> => {
    const params = new URLSearchParams();
    const set = (key: string, val: string | number | undefined) => {
        if (val != null) params.set(key, String(val));
    };

    set("page",           p.page);
    set("pageSize",       p.pageSize);
    set("select",         p.select);
    set("sortBy",         p.sortBy);
    set("sortDir",        p.sortDir);
    set("make",           p.make);
    set("model",          p.model);
    set("modelYear",      p.modelYear);
    set("minModelYear",   p.minModelYear);
    set("maxModelYear",   p.maxModelYear);
    set("transmission",   p.transmission);
    set("drivetrain",     p.drivetrain);
    set("engineLayout",   p.engineLayout);
    set("fuel",           p.fuel);
    set("bodyType",       p.bodyType);
    set("roofType",       p.roofType);
    set("vehicleClass",   p.vehicleClass);
    set("minHorsepower",  p.minHorsepower);
    set("maxHorsepower",  p.maxHorsepower);
    set("minTorque",      p.minTorque);
    set("maxTorque",      p.maxTorque);
    set("minSeats",       p.minSeats);
    set("maxSeats",       p.maxSeats);
    set("minMpg",         p.minMpg);
    set("maxMpg",         p.maxMpg);
    set("minCylinders",   p.minCylinders);
    set("maxCylinders",   p.maxCylinders);
    set("minGears",       p.minGears);
    set("maxGears",       p.maxGears);
    set("minPricePerDay", p.minPricePerDay);
    set("maxPricePerDay", p.maxPricePerDay);

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
    const params = new URLSearchParams();
    if (page) params.set("page", String(page));
    if (pageSize) params.set("pageSize", String(pageSize));
    const res = await fetch(
        `${process.env.API_BASE_URL}/cars?${params.toString()}`,
        { ...defaultNext, headers: defaultHeaders },
    );
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const getCar = async (vin: string): Promise<Car> => {
    const res = await fetch(`${process.env.API_BASE_URL}/cars/${vin}`, {
        ...defaultNext,
        headers: defaultHeaders,
    });
    if (!res.ok) throw new Error(`Failed to fetch data from ${res.url}`);
    return res.json();
};
