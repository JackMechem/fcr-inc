package com.inc.fcr.car;

import org.junit.jupiter.api.*;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class CarTest {

    @Test
    @DisplayName("Test getReservationDates processes & returns date ranges")
    void getReservationDates() {
        try {
            // Disabled test cars
            Car res0 = new Car("21847S281367");
            Car res1 = new Car("SALRG2RK1JA073756");
            Car resN = new Car("WMEEK31X78K084848");

            assertAll(
                    () -> assertEquals(List.of(), res0.getReservationDates(),
                            "Expected empty list of reservation date ranges for res0"),
                    () -> assertEquals(List.of(List.of(Instant.parse("2026-01-13T08:00:00.000Z"), Instant.parse("2026-01-17T08:00:00.000Z")) ), res1.getReservationDates(),
                            "Expected singleton list of reservation date ranges for res1"),
                    () -> assertEquals(List.of(List.of(Instant.parse("2026-03-09T07:00:00.000Z"), Instant.parse("2026-03-14T07:00:00.000Z")),
                                    List.of(Instant.parse("2026-04-28T07:00:00.000Z"), Instant.parse("2026-04-29T07:00:00.000Z")) ), resN.getReservationDates(),
                            "Expected N-size list of reservation date ranges for resN")
            );
        } catch (IllegalAccessException assumeOkay) {}
    }
}