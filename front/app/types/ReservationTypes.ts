import { Car } from "./CarTypes";

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
    car: Car;
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
