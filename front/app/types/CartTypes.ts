export interface CartProps {
    vin: string;
    make: string;
    model: string;
    pricePerDay: number;
    image?: string;
    startDate?: string;
    endDate?: string;
}

export interface CartCardInfo {
    /** The cart entry for this specific car, if it's in the cart. */
    cartItem?: CartProps;
    /** Other cart items whose rental dates overlap the current browse date range. */
    cartConflicts?: CartProps[];
}
