package com.inc.fcr.database;

import com.inc.fcr.errorHandling.*;
import com.inc.fcr.car.Car;
import com.inc.fcr.car.CarPagesWrapper;
import com.inc.fcr.utils.HibernateUtil;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Order;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Selection;

import org.hibernate.HibernateException;
import org.hibernate.Session;
import org.hibernate.Transaction;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class DatabaseController {

    /*
     * Get Car(s) Functions
     */

    public static CarPagesWrapper getCars(ParsedQueryParams params) throws HibernateException, QueryParamException {
        params.printParams();

        int limit = params.getPageSize();
        int page = params.getPage();
        int offset = (page - 1) * limit;

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            CriteriaBuilder cb = session.getCriteriaBuilder();

            long totalItems = getCarCount(session, cb, params);
            int totalPages = totalItems == 0 ? 0 : (int) Math.ceil((double) totalItems / limit);

            if (params.getSelectFields() != null) {
                List<Map<String, Object>> rows = getSelectedCars(session, cb, params, offset, limit);
                return new CarPagesWrapper(rows, page, totalPages, totalItems);
            } else {
                List<Car> rows = getFullCars(session, cb, params, offset, limit);
                return new CarPagesWrapper(rows, page, totalPages, totalItems);
            }
        }
    }

    private static List<Car> getFullCars(Session session, CriteriaBuilder cb, ParsedQueryParams params, int offset, int limit)
            throws QueryParamException {

        CriteriaQuery<Car> query = cb.createQuery(Car.class);
        Root<Car> root = query.from(Car.class);

        List<Predicate> predicates = buildPredicates(params, cb, root);

        query.select(root);
        if (!predicates.isEmpty()) {
            query.where(predicates.toArray(new Predicate[0]));
        }

        query.orderBy(buildSort(params, cb, root));

        return session.createQuery(query)
                .setFirstResult(offset)
                .setMaxResults(limit)
                .getResultList();
    }

    private static List<Map<String, Object>> getSelectedCars(
            Session session,
            CriteriaBuilder cb,
            ParsedQueryParams params,
            int offset,
            int limit
    ) throws QueryParamException {

        CriteriaQuery<Object[]> query = cb.createQuery(Object[].class);
        Root<Car> root = query.from(Car.class);

        List<Predicate> predicates = buildPredicates(params, cb, root);

        List<Selection<?>> selections = new ArrayList<>();
        for (String field : params.getSelectFields()) {
            selections.add(root.get(field));
        }

        query.multiselect(selections);
        if (!predicates.isEmpty()) {
            query.where(predicates.toArray(new Predicate[0]));
        }

        query.orderBy(buildSort(params, cb, root));

        List<Object[]> rawRows = session.createQuery(query)
                .setFirstResult(offset)
                .setMaxResults(limit)
                .getResultList();

        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : rawRows) {
            Map<String, Object> carMap = new LinkedHashMap<>();
            for (int i = 0; i < params.getSelectFields().size(); i++) {
                carMap.put(params.getSelectFields().get(i), row[i]);
            }
            result.add(carMap);
        }

        return result;
    }

    private static long getCarCount(Session session, CriteriaBuilder cb, ParsedQueryParams params) {
        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<Car> countRoot = countQuery.from(Car.class);

        List<Predicate> predicates = buildPredicates(params, cb, countRoot);

        countQuery.select(cb.count(countRoot));
        if (!predicates.isEmpty()) {
            countQuery.where(predicates.toArray(new Predicate[0]));
        }

        return session.createQuery(countQuery).getSingleResult();
    }

    public static Car getCarFromVin(String vin) throws HibernateException {
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            return session.get(Car.class, vin);
        }
    }

    public static Map<String, Object> getCarFromVinSelect(String vin, ParsedQueryParams params)
            throws HibernateException, QueryParamException {

        params.setVinFilter(vin);

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            CriteriaBuilder cb = session.getCriteriaBuilder();

            List<String> selectFields = params.getSelectFields();
            if (selectFields == null || selectFields.isEmpty()) {
                throw new QueryParamException("select is required for getCarFromVinSelect");
            }

            if (selectFields.size() == 1) {
                CriteriaQuery<Object> query = cb.createQuery(Object.class);
                Root<Car> root = query.from(Car.class);

                List<Predicate> predicates = buildPredicates(params, cb, root);
                query.select(root.get(selectFields.get(0)));

                if (!predicates.isEmpty()) {
                    query.where(predicates.toArray(new Predicate[0]));
                }

                Object single = session.createQuery(query).uniqueResult();
                if (single == null) return null;

                Map<String, Object> result = new LinkedHashMap<>();
                result.put(selectFields.get(0), single);
                return result;
            } else {
                CriteriaQuery<Object[]> query = cb.createQuery(Object[].class);
                Root<Car> root = query.from(Car.class);

                List<Predicate> predicates = buildPredicates(params, cb, root);

                List<Selection<?>> selections = new ArrayList<>();
                for (String field : selectFields) {
                    selections.add(root.get(field));
                }

                query.multiselect(selections);

                if (!predicates.isEmpty()) {
                    query.where(predicates.toArray(new Predicate[0]));
                }

                Object[] row = session.createQuery(query).uniqueResult();
                if (row == null) return null;

                Map<String, Object> result = new LinkedHashMap<>();
                for (int i = 0; i < selectFields.size(); i++) {
                    result.put(selectFields.get(i), row[i]);
                }
                return result;
            }
        }
    }

    private static List<Predicate> buildPredicates(ParsedQueryParams params, CriteriaBuilder cb, Root<Car> root) {
        List<Predicate> predicates = new ArrayList<>();

        // VIN exact filter
        if (params.getVinFilter() != null) {
            predicates.add(cb.equal(root.get("vin"), params.getVinFilter()));
        }

        // Generic search across make/model/description
        if (params.getQ() != null) {
            String pattern = "%" + params.getQ().toLowerCase() + "%";
            predicates.add(cb.or(
                    cb.like(cb.lower(root.get("make")), pattern),
                    cb.like(cb.lower(root.get("model")), pattern),
                    cb.like(cb.lower(root.get("description")), pattern)
            ));
        }

        // Partial text matches
        if (params.getMake() != null) {
            predicates.add(cb.like(cb.lower(root.get("make")), "%" + params.getMake().toLowerCase() + "%"));
        }

        if (params.getModel() != null) {
            predicates.add(cb.like(cb.lower(root.get("model")), "%" + params.getModel().toLowerCase() + "%"));
        }

        if (params.getDescription() != null) {
            predicates.add(cb.like(cb.lower(root.get("description")), "%" + params.getDescription().toLowerCase() + "%"));
        }

        // Exact numeric
        if (params.getModelYear() != null) {
            predicates.add(cb.equal(root.get("modelYear"), params.getModelYear()));
        }

        // Numeric ranges
        if (params.getMinModelYear() != null) {
            predicates.add(cb.ge(root.get("modelYear"), params.getMinModelYear()));
        }
        if (params.getMaxModelYear() != null) {
            predicates.add(cb.le(root.get("modelYear"), params.getMaxModelYear()));
        }

        if (params.getMinPricePerDay() != null) {
            predicates.add(cb.ge(root.get("pricePerDay"), params.getMinPricePerDay()));
        }
        if (params.getMaxPricePerDay() != null) {
            predicates.add(cb.le(root.get("pricePerDay"), params.getMaxPricePerDay()));
        }

        if (params.getMinHorsepower() != null) {
            predicates.add(cb.ge(root.get("horsepower"), params.getMinHorsepower()));
        }
        if (params.getMaxHorsepower() != null) {
            predicates.add(cb.le(root.get("horsepower"), params.getMaxHorsepower()));
        }

        if (params.getMinSeats() != null) {
            predicates.add(cb.ge(root.get("seats"), params.getMinSeats()));
        }
        if (params.getMaxSeats() != null) {
            predicates.add(cb.le(root.get("seats"), params.getMaxSeats()));
        }

        if (params.getMinMpg() != null) {
            predicates.add(cb.ge(root.get("mpg"), params.getMinMpg()));
        }
        if (params.getMaxMpg() != null) {
            predicates.add(cb.le(root.get("mpg"), params.getMaxMpg()));
        }

        // Exact enum filters
        if (params.getTransmission() != null) {
            predicates.add(cb.equal(root.get("transmission"), params.getTransmission()));
        }
        if (params.getDrivetrain() != null) {
            predicates.add(cb.equal(root.get("drivetrain"), params.getDrivetrain()));
        }
        if (params.getEngineLayout() != null) {
            predicates.add(cb.equal(root.get("engineLayout"), params.getEngineLayout()));
        }
        if (params.getFuel() != null) {
            predicates.add(cb.equal(root.get("fuel"), params.getFuel()));
        }
        if (params.getBodyType() != null) {
            predicates.add(cb.equal(root.get("bodyType"), params.getBodyType()));
        }
        if (params.getRoofType() != null) {
            predicates.add(cb.equal(root.get("roofType"), params.getRoofType()));
        }
        if (params.getVehicleClass() != null) {
            predicates.add(cb.equal(root.get("vehicleClass"), params.getVehicleClass()));
        }

        return predicates;
    }

    private static Order buildSort(ParsedQueryParams params, CriteriaBuilder cb, Root<Car> root) throws QueryParamException {
        String sortBy = params.getSortBy();
        String sortDir = params.getSortDir();

        if (sortBy == null || sortBy.isBlank()) {
            sortBy = "vin";
        }

        Path<?> sortPath;
        try {
            sortPath = root.get(sortBy);
        } catch (IllegalArgumentException e) {
            throw new QueryParamException("Invalid sortBy field: " + sortBy);
        }

        if ("desc".equalsIgnoreCase(sortDir)) {
            return cb.desc(sortPath);
        }
        return cb.asc(sortPath);
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
            if (transaction != null) {
                transaction.rollback();
            }
            throw e;
        }
    }

    /*
     * Delete
     */

    public static void deleteCar(String vin) throws HibernateException, ValidationException {
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
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
    }
}