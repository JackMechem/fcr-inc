package com.inc.fcr.database;

import com.inc.fcr.errorHandling.*;
import com.inc.fcr.car.Car;
import com.inc.fcr.car.CarPagesWrapper;
import com.inc.fcr.car.CarSelectPagesWrapper;

import org.hibernate.Session;
import org.hibernate.Transaction;

import com.inc.fcr.utils.HibernateUtil;

import jakarta.persistence.TypedQuery;

import java.beans.Transient;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.inc.fcr.car.enums.*;

public class DatabaseController {

    /*
     * Global Variables
     */

    private static final int DEFAULT_PAGE_SIZE = 10;

    // Fields allowed to be sorted by
    private static final List<String> VALID_SORT_FIELDS = List.of(
            "vin", "make", "model", "modelYear", "cylinders", "gears",
            "horsepower", "torque", "seats", "pricePerDay", "mpg",
            "transmission", "drivetrain", "engineLayout", "fuel",
            "bodyType", "roofType", "vehicleClass");

    // Maps lowercase to camel case for all fields
    private static final Map<String, String> FIELD_MAP;

    // Dynamically populates FIELD_MAP based on Car class;
    // runs when class is first loaded
    static {
        Map<String, String> fieldMap = new LinkedHashMap<>();
        for (Field field : Car.class.getDeclaredFields()) {
            // Skip static and transient fields
            if (java.lang.reflect.Modifier.isStatic(field.getModifiers()))
                continue;
            if (field.isAnnotationPresent(Transient.class))
                continue;

            String name = field.getName();
            fieldMap.put(name.toLowerCase(), name);
        }
        FIELD_MAP = Collections.unmodifiableMap(fieldMap);
    }



    /*
     * Get Car(s) Functions
     */

    public static CarPagesWrapper getCarsFiltered(int page, int pageSize,
            String transmission, String drivetrain, String engineLayout,
            String fuel, String bodyType, String roofType, String vehicleClass,
            String sortBy, String sortDir) {

        // Set page and page size; if null set to default
        int currentPage = (page <= 0) ? 1 : page;
        int limit = (pageSize <= 0) ? DEFAULT_PAGE_SIZE : pageSize;
        int offset = (currentPage - 1) * limit;

        Session session = HibernateUtil.getSessionFactory().openSession();

        // Base query strings
        StringBuilder queryStr = new StringBuilder("FROM Car c");
        StringBuilder countStr = new StringBuilder("SELECT count(c) FROM Car c");

        // Append filters and sort to query string;
        // if all are null, don't filter and set sort to default
        String filters = buildFilters(transmission, drivetrain, engineLayout, fuel, bodyType, roofType, vehicleClass);
        queryStr.append(filters);
        countStr.append(filters);
        appendSort(queryStr, sortBy, sortDir);

        // Create queries
        TypedQuery<Car> query = session.createQuery(queryStr.toString(), Car.class);
        TypedQuery<Long> countQuery = session.createQuery(countStr.toString(), Long.class);

        // Bind given field names to correct case
        bindFilterParams(query, countQuery, transmission, drivetrain, engineLayout, fuel, bodyType, roofType,
                vehicleClass);

        Long totalItems = countQuery.getSingleResult();
        List<Car> cars = query.setFirstResult(offset).setMaxResults(limit).getResultList();
        int totalPages = (int) Math.ceil((double) totalItems / limit);

        return new CarPagesWrapper(cars, currentPage, totalPages, totalItems);
    }

    public static CarSelectPagesWrapper getCarsFilteredSelect(int page, int pageSize,
            String transmission, String drivetrain, String engineLayout,
            String fuel, String bodyType, String roofType, String vehicleClass,
            String[] select, String sortBy, String sortDir) throws Exception {

        // Set page and page size; if null set to default
        int currentPage = (page <= 0) ? 1 : page;
        int limit = (pageSize <= 0) ? DEFAULT_PAGE_SIZE : pageSize;
        int offset = (currentPage - 1) * limit;

        Session session = HibernateUtil.getSessionFactory().openSession();

        // Checks if given select values are valid
        List<String> validSelect = Arrays.stream(select)
                .filter(f -> FIELD_MAP.containsKey(f.toLowerCase()))
                .toList();

        if (validSelect.size() < 1)
            throw new QueryParamValidationException(
                    "Valid fields for parameter 'select': " + String.join(", ", FIELD_MAP.keySet()));

        // Format valid select into string for Hibernate
        String selectClause = validSelect.stream()
                .map(f -> "c." + FIELD_MAP.get(f.toLowerCase()))
                .collect(Collectors.joining(", "));

        // Base query strings
        StringBuilder queryStr = new StringBuilder("SELECT " + selectClause + " FROM Car c");
        StringBuilder countStr = new StringBuilder("SELECT count(c) FROM Car c");

        // Append filters and sort to query string;
        // if all are null, don't filter and set sort to default
        String filters = buildFilters(transmission, drivetrain, engineLayout, fuel, bodyType, roofType, vehicleClass);
        queryStr.append(filters);
        countStr.append(filters);
        appendSort(queryStr, sortBy, sortDir);

        // Create queries
        TypedQuery<Object[]> query = session.createQuery(queryStr.toString(), Object[].class);
        TypedQuery<Long> countQuery = session.createQuery(countStr.toString(), Long.class);

        // Bind given field names to correct case
        bindFilterParams(query, countQuery, transmission, drivetrain, engineLayout, fuel, bodyType, roofType,
                vehicleClass);

        Long totalItems = countQuery.getSingleResult();
        List<Object[]> rows = query.setFirstResult(offset).setMaxResults(limit).getResultList();
        int totalPages = (int) Math.ceil((double) totalItems / limit);

        // Converts rows to a map list
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : rows) {
            Map<String, Object> carMap = new LinkedHashMap<>();
            for (int i = 0; i < validSelect.size(); i++) {
                carMap.put(FIELD_MAP.get(validSelect.get(i).toLowerCase()), row[i]);
            }
            result.add(carMap);
        }

        return new CarSelectPagesWrapper(result, currentPage, totalPages, totalItems);
    }

    public static Car getCarFromVin(String vin) throws RuntimeException {
        Session session = HibernateUtil.getSessionFactory().openSession();
        return session.get(Car.class, vin);
    }

    public static Map<String, Object> getCarFromVinSelect(String vin, String[] select) throws Exception {
        Session session = HibernateUtil.getSessionFactory().openSession();

        // Checks if given select values are valid
        List<String> validSelect = Arrays.stream(select)
                .filter(f -> FIELD_MAP.containsKey(f.toLowerCase()))
                .toList();

        // Format valid select into string for Hibernate
        String selectClause = validSelect.stream()
                .map(f -> "c." + FIELD_MAP.get(f.toLowerCase()))
                .collect(Collectors.joining(", "));

        Object[] row;

        // Create row object(s)
        if (validSelect.size() < 1) {
            throw new QueryParamValidationException(
                    "Valid fields for parameter 'select': " + String.join(", ", FIELD_MAP.keySet()));
        } else if (validSelect.size() == 1) {
            // Single queries don't return an array
            Object single = session
                    .createQuery("SELECT " + selectClause + " FROM Car c WHERE c.vin = :vin", Object.class)
                    .setParameter("vin", vin)
                    .uniqueResult();
            row = new Object[] { single };
        } else {
            row = session
                    .createQuery("SELECT " + selectClause + " FROM Car c WHERE c.vin = :vin", Object[].class)
                    .setParameter("vin", vin)
                    .uniqueResult();
        }

        // Create map with field name and value
        Map<String, Object> carMap = new LinkedHashMap<>();
        for (int i = 0; i < validSelect.size(); i++) {
            carMap.put(FIELD_MAP.get(validSelect.get(i).toLowerCase()), row[i]);
        }
        return carMap;
    }



    /*
     * Insert & Update
     */

    public static void insertCar(Car car) throws RuntimeException {
        insertUpdateCar(car, true);
    }

    public static void updateCar(Car car) throws RuntimeException {
        insertUpdateCar(car, false);
    }

    public static void insertUpdateCar(Car car, boolean insertingCar) throws RuntimeException {
        Transaction transaction = null;
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            transaction = session.beginTransaction();

            Car existingCar = session.get(Car.class, car.getVin());
            boolean carInDB = (existingCar != null);

            if (insertingCar && carInDB) {
                throw new RuntimeException("Car with VIN " + car.getVin() + " already exists.");
            }
            if (!insertingCar && !carInDB) {
                throw new RuntimeException("Car with VIN " + car.getVin() + " doesn't exist.");
            }

            session.merge(car);

            transaction.commit();
            System.out.println("Car successfully " + (insertingCar ? "inserted" : "updated") + ".");

        } catch (Exception e) {
            if (transaction != null)
                transaction.rollback();
            throw e;
        }
    }

    /*
     * Delete
     */

    public static void deleteCar(String vin) throws RuntimeException {
        Transaction transaction = null;
        Session session = HibernateUtil.getSessionFactory().openSession();
        transaction = session.beginTransaction();

        Car car = session.get(Car.class, vin);

        if (car != null) {
            session.remove(car);
            System.out.println("Car with VIN " + vin + " was deleted.");
        } else {
            System.out.println("No car found with VIN: " + vin);
        }

        transaction.commit();

    }



    /*
     * Helper Functions
     */

    // Convert filter strings to their enum types;
    // bind them to both queries
    private static void bindFilterParams(TypedQuery<?> query, TypedQuery<?> countQuery,
            String transmission, String drivetrain, String engineLayout,
            String fuel, String bodyType, String roofType, String vehicleClass) {

        Map<String, Object> params = new LinkedHashMap<>();
        if (transmission != null)
            params.put("transmission", TransmissionType.valueOf(transmission));
        if (drivetrain != null)
            params.put("drivetrain", Drivetrain.valueOf(drivetrain));
        if (engineLayout != null)
            params.put("engineLayout", EngineLayout.valueOf(engineLayout));
        if (fuel != null)
            params.put("fuel", FuelType.valueOf(fuel));
        if (bodyType != null)
            params.put("bodyType", BodyType.valueOf(bodyType));
        if (roofType != null)
            params.put("roofType", RoofType.valueOf(roofType));
        if (vehicleClass != null)
            params.put("vehicleClass", VehicleClass.valueOf(vehicleClass));

        for (var entry : params.entrySet()) {
            query.setParameter(entry.getKey(), entry.getValue());
            countQuery.setParameter(entry.getKey(), entry.getValue());
        }
    }

    // Build filters to append to query strings (if any)
    private static String buildFilters(
            String transmission, String drivetrain, String engineLayout,
            String fuel, String bodyType, String roofType, String vehicleClass) {

        StringBuilder filters = new StringBuilder(" WHERE 1=1");

        if (transmission != null) filters.append(" AND c.transmission = :transmission");
        if (drivetrain != null) filters.append(" AND c.drivetrain = :drivetrain");
        if (engineLayout != null) filters.append(" AND c.engineLayout = :engineLayout");
        if (fuel != null) filters.append(" AND c.fuel = :fuel");
        if (bodyType != null) filters.append(" AND c.bodyType = :bodyType");
        if (roofType != null) filters.append(" AND c.roofType = :roofType");
        if (vehicleClass != null) filters.append(" AND c.vehicleClass = :vehicleClass");

        return filters.toString();
    }

    // Appends filters to query string;
    // does nothing if both sortBy and sortDir are null
    // defaults to ascending if just sortDir is null;
    private static void appendSort(StringBuilder queryStr, String sortBy, String sortDir) {
        if (sortBy != null && VALID_SORT_FIELDS.contains(sortBy)) {
            String dir = (sortDir != null && sortDir.equalsIgnoreCase("desc")) ? "DESC" : "ASC";
            queryStr.append(" ORDER BY c.").append(sortBy).append(" ").append(dir);
        }
    }

}
