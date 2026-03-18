package com.inc.fcr.user;

import jakarta.persistence.Embeddable;

@Embeddable
public record DriversLicense(
        String driversLicense,
        String region,
        long expirationDate,
        long dateOfBirth
) {
}
