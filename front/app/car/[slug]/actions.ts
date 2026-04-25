"use server";
import { serverApi } from "@/app/lib/fcr-client/server";

export async function getCarAndReviews(vin: string) {
    const [car, reviews] = await Promise.all([
        serverApi.cars.getById(vin),
        serverApi.reviews.getForCar(vin),
    ]);
    return { car, reviews };
}

export async function getSimilarCars(make: string, excludeVin: string) {
    const result = await serverApi.cars.getFiltered({ make, pageSize: 7 });
    const cars = Array.isArray(result?.data) ? result.data : [];
    return cars.filter((c) => c.vin !== excludeVin).slice(0, 6);
}
