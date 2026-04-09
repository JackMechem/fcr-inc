package com.inc.fcr.database;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.inc.fcr.user.Address;
import com.inc.fcr.user.DriversLicense;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.ArrayList;

/*
    Hibernate converter types for more
    custom data types, generally converted
    into JSON strings stored in the database
 */

public class Converters {

    public static final ObjectMapper mapper = new ObjectMapper();

    // -- Cars
    @Converter
    public static class JsonListConverter implements AttributeConverter<ArrayList<String>, String> {
        public String convertToDatabaseColumn(ArrayList<String> attribute) {
            try {
                return mapper.writeValueAsString(attribute);
            } catch (Exception e) {
                return "[]";
            }
        }
        public ArrayList<String> convertToEntityAttribute(String dbData) {
            try {
                return mapper.readValue(dbData, new TypeReference<ArrayList<String>>() {});
            } catch (Exception e) {
                return new ArrayList<>();
            }
        }
    }

    // -- Users
    @Converter
    public static class JsonDriversLicenseConverter implements AttributeConverter<DriversLicense, String> {
        public String convertToDatabaseColumn(DriversLicense obj) {
            try {
                return mapper.writeValueAsString(obj);
            } catch (Exception e) {
                return "{}";
            }
        }

        public DriversLicense convertToEntityAttribute(String dbData) {
            try {
                return mapper.readValue(dbData, new TypeReference<DriversLicense>() {});
            } catch (Exception e) {
                return null;
            }
        }
    }

    @Converter
    public static class JsonAddressConverter implements AttributeConverter<Address, String> {
        public String convertToDatabaseColumn(Address obj) {
            try {
                return mapper.writeValueAsString(obj);
            } catch (Exception e) {
                return "{}";
            }
        }

        public Address convertToEntityAttribute(String dbData) {
            try {
                return mapper.readValue(dbData, new TypeReference<Address>() {});
            } catch (Exception e) {
                return null;
            }
        }
    }
}
