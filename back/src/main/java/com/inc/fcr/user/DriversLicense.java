package com.inc.fcr.user;


public record DriversLicense(
        String driversLicense,
        String state,
        long expirationDate,
        long dateOfBirth
) {
}
