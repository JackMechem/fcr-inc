import { Car, CarPages } from "../types/CarTypes";

export const getAllCars = async ({
    page,
    pageSize,
}: {
    page?: number;
    pageSize?: number;
} = {}): Promise<CarPages> => {
    const params = new URLSearchParams();
    if (page) params.set("page", String(page));
    if (pageSize) params.set("pageSize", String(pageSize));

    const res = await fetch(`/api/cars?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const getFilteredCarsAdmin = async (params: Record<string, string | number | undefined>): Promise<CarPages> => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        if (v != null) qs.set(k, String(v));
    }
    const res = await fetch(`/api/cars?${qs.toString()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const getCarAdmin = async (vin: string): Promise<Car> => {
    const res = await fetch(`/api/cars/${vin}`, { cache: "no-store" });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const addCar = async (car: Car) => {
    const res = await fetch("/api/cars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(car),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.text();
};

export const editCar = async (car: Car) => {
    const res = await fetch(`/api/cars/${car.vin}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(car),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.text();
};

export const deleteCar = async (vin: string) => {
    const res = await fetch(`/api/cars/${vin}`, { method: "DELETE" });
    if (!res.ok) throw new Error(await res.text());
    return res.text();
};
