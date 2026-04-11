import { Car } from "./CarTypes";

export interface Payment {
    // extend when payment fields are known
    [key: string]: unknown;
}

export interface Reservation {
    reservationId: number;
    car: Car;
    payments: Payment[];
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
