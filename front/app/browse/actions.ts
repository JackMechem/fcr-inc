"use server";
import { getFilteredCars } from "../lib/CarApi";
import { CarApiParams, CarPages } from "../types/CarTypes";

export async function fetchCarsPage(params: CarApiParams): Promise<CarPages> {
	return getFilteredCars(params);
}
