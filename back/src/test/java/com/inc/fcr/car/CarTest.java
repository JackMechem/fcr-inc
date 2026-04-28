package com.inc.fcr.car;

import org.junit.jupiter.api.*;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class CarTest {

    @Test
    @DisplayName("Test getReservationDates processes & returns date ranges")
    @Disabled("Disabled until test data setup is complete")
    void getReservationDates() {
        try {
            // Disabled test cars
            Car res0 = new Car("21847S281367");
            Car res1 = new Car("");
            Car resN = new Car("");

            assertAll(
                    () -> assertEquals(List.of(), res0.getReservationDates(),
                            "Expected empty list of reservation date ranges for res0"),
                    () -> assertEquals(List.of(List.of(Instant.parse(""), Instant.parse(""))), res1.getReservationDates(),
                            "Expected singleton list of reservation date ranges for res1"),
                    () -> assertEquals(List.of(List.of(Instant.parse(""), Instant.parse("")),
                                    List.of(Instant.parse(""), Instant.parse("")),
                                    List.of(Instant.parse(""), Instant.parse(""))), resN.getReservationDates(),
                            "Expected N-size list of reservation date ranges for resN")
            );
        } catch (IllegalAccessException assumeOkay) {}
    }
}