// ── Car ───────────────────────────────────────────────────────────────────────

export type CarStatus = "AVAILABLE" | "DISABLED" | "ARCHIVED" | "LOANED" | "SERVICE";

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
    carStatus?: CarStatus;
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
    transmission?: string | string[];
    drivetrain?: string | string[];
    engineLayout?: string | string[];
    fuel?: string | string[];
    bodyType?: string | string[];
    roofType?: string | string[];
    vehicleClass?: string | string[];
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

// ── Car enums ─────────────────────────────────────────────────────────────────

export type BodyType = "SEDAN" | "SUV" | "TRUCK" | "CONVERTIBLE" | "HATCHBACK" | "FULL_SIZE" | "COMPACT" | "WAGON" | "ELECTRIC" | "COUPE";
export type EngineLayout = "V" | "INLINE" | "FLAT" | "SINGLE_MOTOR" | "DUAL_MOTOR";
export type FuelType = "GASOLINE" | "DIESEL" | "ELECTRIC" | "HYBRID";
export type RoofType = "SOFTTOP" | "HARDTOP" | "TARGA" | "SLICKTOP" | "SUNROOF" | "PANORAMIC";
export type VehicleClass = "ECONOMY" | "LUXURY" | "PERFORMANCE" | "OFFROAD" | "FULL_SIZE" | "ELECTRIC";
export type TransmissionType = "AUTOMATIC" | "MANUAL";
export type Drivetrain = "FWD" | "RWD" | "AWD";

export interface CarEnums {
    bodyType: BodyType[];
    engineLayout: EngineLayout[];
    fuelType: FuelType[];
    carStatus: CarStatus[];
    roofType: RoofType[];
    vehicleClass: VehicleClass[];
    transmissionType: TransmissionType[];
    drivetrain: Drivetrain[];
}

// ── Reservations ──────────────────────────────────────────────────────────────

export interface Payment {
    paymentId: string;
    totalAmount: number;
    amountPaid: number;
    date: number;
    paymentType: string;
    paid: boolean;
}

export interface Reservation {
    reservationId: number;
    car: Car | string;
    user: number | { userId: number; [key: string]: unknown };
    payments: Payment[] | string[];
    pickUpTime: number;
    dropOffTime: number;
    dateBooked: number;
    durationHours: number;
    durationDays: number;
    duration: number;
}

export interface ReservationPages {
    data: Reservation[];
    currentPage: number;
    totalPages: number;
    totalItems: number;
}

export interface ReservationPatch {
    pickUpTime?: number;
    dropOffTime?: number;
    car?: string;
    user?: number;
}

export interface UserReservationRaw {
    car?: { vin: string } | null;
    pickUpTime: number | string;
    dropOffTime: number | string;
}

// ── Reviews ───────────────────────────────────────────────────────────────────

export interface Review {
    reviewId: number;
    account: number | { acctId: number; name?: string; email?: string; [key: string]: unknown };
    title: string;
    bodyOfText: string;
    stars: number;
    car: string | { vin: string; [key: string]: unknown };
    rentalDuration: number;
    publishedDate: string;
}

export interface ReviewPages {
    data: Review[];
    currentPage: number;
    totalPages: number;
    totalItems: number;
}

// ── Accounts & Users ──────────────────────────────────────────────────────────

export type AccountRole = "CUSTOMER" | "STAFF" | "ADMIN";

export interface Account {
    acctId: number;
    name: string;
    email: string;
    dateCreated: string;
    dateEmailConfirmed: string | null;
    user: number | null;
    role: AccountRole;
    bookmarkedCars?: string[];
}

export interface AccountPages {
    data: Account[];
    currentPage: number;
    totalPages: number;
    totalItems: number;
}

export interface UserAddress {
    buildingNumber: string;
    streetName: string;
    city: string;
    state: string;
    zipCode: string;
}

export interface UserDriversLicense {
    driversLicense: string;
    state: string;
    expirationDate: number;
    dateOfBirth: number;
}

export interface User {
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    dateCreated: string;
    address: UserAddress;
    driversLicense: UserDriversLicense;
    reservations: number[];
    reviews: number[];
}

export interface UserPages {
    data: User[];
    currentPage: number;
    totalPages: number;
    totalItems: number;
}
