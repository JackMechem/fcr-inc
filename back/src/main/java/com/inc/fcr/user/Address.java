package com.inc.fcr.user;

import jakarta.persistence.Embeddable;

@Embeddable

public record Address(
        String buildingNumber,
        String streetName,
        String city,
        String state,
        String zipCode) {
}
