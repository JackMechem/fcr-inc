package com.inc.fcr.user;

import java.time.LocalDate;

public record DriverLicense(

        String driverLicense,

        String region,

        LocalDate dateOfBirth

) {}
