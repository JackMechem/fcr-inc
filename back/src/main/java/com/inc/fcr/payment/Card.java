package com.inc.fcr.payment;

import java.time.LocalDate;

public record Card(

        String cardNumber,

        int securityCode,

        String cardHolder,

        LocalDate expiration

) {}
