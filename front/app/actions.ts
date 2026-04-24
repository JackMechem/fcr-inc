"use server";
import { serverApi } from "@/app/lib/fcr-client/server";

export async function getFeaturedCars() {
    return serverApi.cars.getFiltered({ pageSize: 8, page: 1, sortBy: "pricePerDay", sortDir: "desc" });
}

export async function getBrandScrollData() {
    const [mercedes, bmw, porsche, audi, volkswagen] = await Promise.all([
        serverApi.cars.getFiltered({ pageSize: 1, page: 1, sortBy: "pricePerDay", make: "Mercedes-Benz", sortDir: "asc" }),
        serverApi.cars.getFiltered({ pageSize: 1, page: 1, sortBy: "pricePerDay", make: "BMW",           sortDir: "asc" }),
        serverApi.cars.getFiltered({ pageSize: 1, page: 1, sortBy: "pricePerDay", make: "Porsche",       sortDir: "asc" }),
        serverApi.cars.getFiltered({ pageSize: 1, page: 1, sortBy: "pricePerDay", make: "Audi",          sortDir: "asc" }),
        serverApi.cars.getFiltered({ pageSize: 1, page: 1, sortBy: "pricePerDay", make: "Volkswagen",    sortDir: "asc" }),
    ]);
    return { mercedes, bmw, porsche, audi, volkswagen };
}
