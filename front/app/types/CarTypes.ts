export interface Car {
    vin: string;
    make: string;
    model: string;
    description: string;
    cylinders: number;
    gears: number;
    horsepower: number;
    torque: number;
    seats: number;
    pricePerDay: number;
    mpg: number;
    features: string[];
    images: string[];
    transmission: string;
    drivetrain: string;
    engineLayout: string;
    fuel: string;
    bodyType: string;
    roofType: string;
    vehicleClass: string;
    modelYear: number;
    reservationDates?: number[][];
    [key: string]: string | number | string[] | number[][] | undefined;
}

export interface CarPages {
    data: Car[];
    currentPage: number;
    totalPages: number;
    totalItems: number;
}

export interface CarApiParams {
    page?: number;
    pageSize?: number;
    select?: string;
    sortBy?: string;
    sortDir?: "asc" | "desc";
    fromDate?: string;
    untilDate?: string;
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
    minHorsepower?: number;
    maxHorsepower?: number;
    minTorque?: number;
    maxTorque?: number;
    minSeats?: number;
    maxSeats?: number;
    minMpg?: number;
    maxMpg?: number;
    minCylinders?: number;
    maxCylinders?: number;
    minGears?: number;
    maxGears?: number;
    minPricePerDay?: number;
    maxPricePerDay?: number;
    search?: string;
    availabilityFilter?: string;
}


export interface FilterAndSelectFields {
	page?: string;
	pageSize?: string;
	select?: string;
	sortBy?: string;
	sortDir?: string;
	make?: string;
	model?: string;
	minModelYear?: string;
	maxModelYear?: string;
	transmission?: string;
	drivetrain?: string;
	engineLayout?: string;
	fuel?: string;
	bodyType?: string;
	roofType?: string;
	vehicleClass?: string;
	minHorsepower?: string;
	maxHorsepower?: string;
	minTorque?: string;
	maxTorque?: string;
	minSeats?: string;
	maxSeats?: string;
	minMpg?: string;
	maxMpg?: string;
	minCylinders?: string;
	maxCylinders?: string;
	minGears?: string;
	maxGears?: string;
	minPricePerDay?: string;
	maxPricePerDay?: string;
    search?: string;
}
