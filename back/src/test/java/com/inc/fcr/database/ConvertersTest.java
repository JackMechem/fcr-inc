package com.inc.fcr.database;

import com.inc.fcr.user.DriversLicense;

import static org.junit.jupiter.api.Assertions.*;

class ConvertersTest {

    String testLicenseStr = "{\"licenseNumber\":\"D12345\",\"state\":\"CA\",\"expirationDate\":1903589218,\"issueDate\":1146206818}";
    DriversLicense testLicense = new DriversLicense("D12345", "CA", 1903589218, 1146206818);

    String testLicense0Str = "{\"licenseNumber\":\"\",\"state\":\"\",\"expirationDate\":0,\"issueDate\":0}";
    DriversLicense testLicense0 = new DriversLicense("", "", 0, 0);

    String testLicenseNStr = "{\"licenseNumber\":null,\"state\":null,\"expirationDate\":-1,\"issueDate\":-1}";
    DriversLicense testLicenseN = new DriversLicense(null, null, -1, -1);

    String testLicenseNullStr = "{}";
    DriversLicense testLicenseNull = null;


    void JsonDriversLicenseConverterToDatabaseColumn() {
        assertAll(
                () -> assertEquals(testLicenseStr, new Converters.JsonDriversLicenseConverter().convertToDatabaseColumn(testLicense), "To JSON string converter doesn't match expected output for testLicense"),
                () -> assertEquals(testLicense0Str, new Converters.JsonDriversLicenseConverter().convertToDatabaseColumn(testLicense0), "To JSON string converter doesn't match expected output for testLicense0"),
                () -> assertEquals(testLicenseNStr, new Converters.JsonDriversLicenseConverter().convertToDatabaseColumn(testLicenseN), "To JSON string converter doesn't match expected output for testLicenseN"),
                () -> assertEquals(testLicenseNullStr, new Converters.JsonDriversLicenseConverter().convertToDatabaseColumn(testLicenseNull), "To JSON string converter doesn't match expected output for testLicenseNull")
        );
    }

    void JsonDriversLicenseConverterToEntityAttribute() {
        assertAll(
                () -> assertEquals(testLicense, new Converters.JsonDriversLicenseConverter().convertToEntityAttribute(testLicenseStr), "To License converter doesn't match expected output for testLicense"),
                () -> assertEquals(testLicense0, new Converters.JsonDriversLicenseConverter().convertToEntityAttribute(testLicense0Str), "To License converter doesn't match expected output for testLicense0"),
                () -> assertEquals(testLicenseN, new Converters.JsonDriversLicenseConverter().convertToEntityAttribute(testLicenseNStr), "To License converter doesn't match expected output for testLicenseN"),
                () -> assertEquals(testLicenseNull, new Converters.JsonDriversLicenseConverter().convertToEntityAttribute(testLicenseNullStr), "To License converter doesn't match expected output for testLicenseNull")
        );
    }
}