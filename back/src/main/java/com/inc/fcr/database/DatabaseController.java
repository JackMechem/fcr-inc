package com.inc.fcr.database;

import com.inc.fcr.errorHandling.*;
import com.inc.fcr.car.Car;
import com.inc.fcr.car.CarPagesWrapper;

import org.hibernate.HibernateException;
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
            String sortBy, String sortDir) throws HibernateException, QueryParamException {

        return getCarsFilteredSelect(page, pageSize, transmission, drivetrain, engineLayout,
                fuel, bodyType, roofType, vehicleClass, null, sortBy, sortDir);
    }

    public static CarPagesWrapper getCarsFilteredSelect(int page, int pageSize,
            String transmission, String drivetrain, String engineLayout,
            String fuel, String bodyType, String roofType, String vehicleClass,
            String[] select, String sortBy, String sortDir) throws HibernateException, QueryParamException {

        final boolean selectFields = (select != null);

        // Set page and page size; if null set to default
        int currentPage = (page <= 0) ? 1 : page;
        int limit = (pageSize <= 0) ? DEFAULT_PAGE_SIZE : pageSize;
        int offset = (currentPage - 1) * limit;

        Session session = HibernateUtil.getSessionFactory().openSession();

        // Base query strings
        StringBuilder queryStr = new StringBuilder("FROM Car c");
        StringBuilder countStr = new StringBuilder("SELECT count(c) FROM Car c");

        // Select
        List<String> validSelect = null;
        if (selectFields) {
            // Checks if given select values are valid
            validSelect = Arrays.stream(select)
                    .filter(f -> FIELD_MAP.containsKey(f.toLowerCase()))
                    .toList();

            if (validSelect.isEmpty()) throw new QueryParamException(
                        "Valid fields for parameter 'select': " + String.join(", ", FIELD_MAP.keySet()));

            // Format valid select into string for Hibernate
            String selectClause = validSelect.stream()
                    .map(f -> "c." + FIELD_MAP.get(f.toLowerCase()))
                    .collect(Collectors.joining(", "));

            queryStr.insert(0, "SELECT "+selectClause+" ");
        }

        // Append filters and sort to query string;
        // if all are null, don't filter and set sort to default
        String filters = buildFilters(transmission, drivetrain, engineLayout, fuel, bodyType, roofType, vehicleClass);
        queryStr.append(filters);
        countStr.append(filters);
        appendSort(queryStr, sortBy, sortDir);

        // Create queries
        TypedQuery<Long> countQuery = session.createQuery(countStr.toString(), Long.class);
        Long totalItems = countQuery.getSingleResult();
        int totalPages = (int) Math.ceil((double) totalItems / limit);

        if (selectFields) { // partial car objects
            TypedQuery<Object[]> query = session.createQuery(queryStr.toString(), Object[].class);
            List<Object[]> rows = query.setFirstResult(offset).setMaxResults(limit).getResultList();
            // Converts rows to a map list
            List<Map<String, Object>> result = new ArrayList<>();
            for (Object[] row : rows) {
                Map<String, Object> carMap = new LinkedHashMap<>();
                for (int i = 0; i < validSelect.size(); i++) {
                    carMap.put(FIELD_MAP.get(validSelect.get(i).toLowerCase()), row[i]);
                }
                result.add(carMap);
            }
            return new CarPagesWrapper(result, currentPage, totalPages, totalItems);
        } else { // full car objects
            TypedQuery<Car> query = session.createQuery(queryStr.toString(), Car.class);
            List<Car> rows = query.setFirstResult(offset).setMaxResults(limit).getResultList();
            return new CarPagesWrapper(rows, currentPage, totalPages, totalItems);
        }
    }

    public static Car getCarFromVin(String vin) throws HibernateException {
        Session session = HibernateUtil.getSessionFactory().openSession();
        return session.get(Car.class, vin);
    }

    public static Map<String, Object> getCarFromVinSelect(String vin, String[] select) throws HibernateException, QueryParamException {
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
        if (validSelect.isEmpty()) {
            throw new QueryParamException("Valid fields for parameter 'select': " + String.join(", ", FIELD_MAP.keySet()));
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
        if (row == null) return null;

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

    public static void insertCar(Car car) throws HibernateException, ValidationException {
        insertUpdateCar(car, true);
    }

    public static void updateCar(Car car) throws HibernateException, ValidationException {
        insertUpdateCar(car, false);
    }

    public static void insertUpdateCar(Car car, boolean insertingCar) throws HibernateException, ValidationException {
        Transaction transaction = null;
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            transaction = session.beginTransaction();

            Car existingCar = session.get(Car.class, car.getVin());
            boolean carInDB = (existingCar != null);

            if (insertingCar && carInDB) {
                throw new ValidationException("Car with VIN " + car.getVin() + " already exists.");
            }
            if (!insertingCar && !carInDB) {
                throw new ValidationException("Car with VIN " + car.getVin() + " doesn't exist.");
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

    public static void deleteCar(String vin) throws HibernateException, ValidationException {
        Session session = HibernateUtil.getSessionFactory().openSession();

        Car car = session.get(Car.class, vin);

        if (car != null) {
            Transaction transaction = session.beginTransaction();
            session.remove(car);
            transaction.commit();
            System.out.println("Car with VIN " + vin + " was deleted.");
        } else {
            throw new ValidationException("Car not found.");
        }
    }



    /*
     * Helper Functions
     */

    // Build filters to append to query strings (if any)
    private static String buildFilters(
            String transmission, String drivetrain, String engineLayout,
            String fuel, String bodyType, String roofType, String vehicleClass) {

        StringBuilder filters = new StringBuilder(" WHERE 1=1");
        // Note: safe because converts to enum first (else query inject vulnerability)
        if (transmission != null) filters.append(" AND c.transmission = ").append(TransmissionType.valueOf(transmission));
        if (drivetrain != null) filters.append(" AND c.drivetrain = ").append(Drivetrain.valueOf(drivetrain));
        if (engineLayout != null) filters.append(" AND c.engineLayout = ").append(EngineLayout.valueOf(engineLayout));
        if (fuel != null) filters.append(" AND c.fuel = ").append(FuelType.valueOf(fuel));
        if (bodyType != null) filters.append(" AND c.bodyType = ").append(BodyType.valueOf(bodyType));
        if (roofType != null) filters.append(" AND c.roofType = ").append(RoofType.valueOf(roofType));
        if (vehicleClass != null) filters.append(" AND c.vehicleClass = ").append(VehicleClass.valueOf(vehicleClass));

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
