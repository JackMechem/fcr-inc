package com.inc.fcr.reservation;

import com.inc.fcr.auth.Account;
import com.inc.fcr.car.Car;

import java.time.Instant;

/**
 * Represents a reservation in the cart with a car and rental dates.
 * Used by {@link Account} to store pending reservations before checkout.
 * Not a JPA entity, just a simple data holder.
 */
public record CartReservation(
        Car car,
        Instant startDate,
        Instant endDate
) {}
