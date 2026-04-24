package com.inc.fcr.database;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.inc.fcr.reservation.CartReservation;
import com.inc.fcr.user.Address;
import com.inc.fcr.user.DriversLicense;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.ArrayList;
import java.util.List;

/**
 * Collection of JPA {@link AttributeConverter} implementations used to persist
 * complex Java types as JSON strings in the database.
 *
 * <p>Each nested converter class handles one specific type mapping:</p>
 * <ul>
 *   <li>{@link JsonListConverter}          — {@code ArrayList<String>} ↔ JSON array string</li>
 *   <li>{@link JsonDriversLicenseConverter}— {@link com.inc.fcr.user.DriversLicense} ↔ JSON object string</li>
 *   <li>{@link JsonAddressConverter}       — {@link com.inc.fcr.user.Address} ↔ JSON object string</li>
 *   <li>{@link JsonCartReservationConverter} — {@code List<CartReservation>} ↔ JSON array string</li>
 * </ul>
 */
public class Converters {

    /** Shared Jackson mapper instance used by all converters in this class. */
    public static final ObjectMapper mapper = new ObjectMapper().findAndRegisterModules();

    /**
     * Converts an {@code ArrayList<String>} to/from a JSON array string for database storage.
     *
     * <p>Used for the {@code features} and {@code images} fields on {@link com.inc.fcr.car.Car}.</p>
     */
    @Converter
    public static class JsonListConverter implements AttributeConverter<ArrayList<String>, String> {
        /**
         * Serializes the list to a JSON array string. Returns {@code "[]"} on error.
         *
         * @param attribute the list to serialize
         * @return JSON representation of the list
         */
        public String convertToDatabaseColumn(ArrayList<String> attribute) {
            try {
                return mapper.writeValueAsString(attribute);
            } catch (Exception e) {
                return "[]";
            }
        }
        /**
         * Deserializes a JSON array string back to an {@code ArrayList<String>}.
         * Returns an empty list on error.
         *
         * @param dbData the JSON string from the database column
         * @return the deserialized list, or an empty list on failure
         */
        public ArrayList<String> convertToEntityAttribute(String dbData) {
            try {
                return mapper.readValue(dbData, new TypeReference<ArrayList<String>>() {});
            } catch (Exception e) {
                return new ArrayList<>();
            }
        }
    }

    /**
     * Converts a {@link DriversLicense} value object to/from a JSON object string.
     *
     * <p>Used for the {@code driversLicense} column on {@link com.inc.fcr.user.User}.</p>
     */
    @Converter
    public static class JsonDriversLicenseConverter implements AttributeConverter<DriversLicense, String> {
        /**
         * Serializes a {@link DriversLicense} to JSON. Returns {@code "{}"} on error.
         *
         * @param obj the license object to serialize
         * @return JSON representation of the license
         */
        public String convertToDatabaseColumn(DriversLicense obj) {
            try {
                return mapper.writeValueAsString(obj);
            } catch (Exception e) {
                return "{}";
            }
        }

        /**
         * Deserializes a JSON string to a {@link DriversLicense}. Returns {@code null} on error.
         *
         * @param dbData the JSON string from the database column
         * @return the deserialized license, or {@code null} on failure
         */
        public DriversLicense convertToEntityAttribute(String dbData) {
            try {
                return mapper.readValue(dbData, new TypeReference<DriversLicense>() {});
            } catch (Exception e) {
                return null;
            }
        }
    }

    /**
     * Converts an {@link Address} value object to/from a JSON object string.
     *
     * <p>Used for the {@code address} column on {@link com.inc.fcr.user.User}.</p>
     */
    @Converter
    public static class JsonAddressConverter implements AttributeConverter<Address, String> {
        /**
         * Serializes an {@link Address} to JSON. Returns {@code "{}"} on error.
         *
         * @param obj the address object to serialize
         * @return JSON representation of the address
         */
        public String convertToDatabaseColumn(Address obj) {
            try {
                return mapper.writeValueAsString(obj);
            } catch (Exception e) {
                return "{}";
            }
        }

        /**
         * Deserializes a JSON string to an {@link Address}. Returns {@code null} on error.
         *
         * @param dbData the JSON string from the database column
         * @return the deserialized address, or {@code null} on failure
         */
        public Address convertToEntityAttribute(String dbData) {
            try {
                return mapper.readValue(dbData, new TypeReference<Address>() {});
            } catch (Exception e) {
                return null;
            }
        }
    }

    /**
     * Converts a {@code List<CartReservation>} to/from a JSON array string.
     *
     * <p>Used for cart reservation list data in database storage.</p>
     */
    @Converter
    public static class JsonCartReservationConverter implements AttributeConverter<List<CartReservation>, String> {
        /**
         * Serializes the list to a JSON array string. Returns {@code "[]"} on error.
         *
         * @param attribute the list to serialize
         * @return JSON representation of the list
         */
        public String convertToDatabaseColumn(List<CartReservation> attribute) {
            if (attribute == null) return "[]";
            try {
                return mapper.writeValueAsString(attribute);
            } catch (Exception e) {
                return "[]";
            }
        }

        /**
         * Deserializes a JSON array string back to a {@code List<CartReservation>}.
         * Returns an empty list on error.
         *
         * @param dbData the JSON string from the database column
         * @return the deserialized list, or an empty list on failure
         */
        public List<CartReservation> convertToEntityAttribute(String dbData) {
            if (dbData == null) return new ArrayList<>();
            try {
                List<CartReservation> result = mapper.readValue(dbData, new TypeReference<List<CartReservation>>() {});
                return result != null ? result : new ArrayList<>();
            } catch (Exception e) {
                return new ArrayList<>();
            }
        }
    }
}
