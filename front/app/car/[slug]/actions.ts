"use server";
import { serverApi } from "@/app/lib/fcr-client/server";

export async function getCarAndReviews(vin: string) {
    const [car, reviews] = await Promise.all([
        serverApi.cars.getById(vin),
        serverApi.reviews.getForCar(vin),
    ]);
    return { car, reviews };
}
