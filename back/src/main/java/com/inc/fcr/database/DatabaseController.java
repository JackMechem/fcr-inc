package com.inc.fcr.database;

import com.inc.fcr.errorHandling.*;
import com.inc.fcr.car.Car;

import org.hibernate.HibernateException;
import org.hibernate.Session;
import org.hibernate.Transaction;

import com.inc.fcr.utils.HibernateUtil;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class DatabaseController {

    /*
     * Get Car(s) Functions
     */

    public static PagesWrapper getCars(ParsedQueryParams params) throws HibernateException, QueryParamException {
        // Print parsed query params
        params.printParams();

        // Page variables
        int limit  = params.getPageSize();
        int page   = params.getPage();
        int offset = (page - 1) * limit;

        // Make sql query strings
        String filterClause = params.getFilterClause();
        String queryString  = (params.getSelectFields() != null ? "SELECT " + params.getSelectClause() + " " : "") + "FROM Car c" + filterClause + params.getSortClause();
        String countString  = "SELECT count(c) FROM Car c" + filterClause;

        // Hibernate session
        Session session = HibernateUtil.getSessionFactory().openSession();

        // Get total items in database and calculate total pages
        long totalItems = session.createQuery(countString, Long.class).getSingleResult();
        int totalPages  = (int) Math.ceil((double) totalItems / limit);

        // Build car map and return
        if (params.getSelectFields() != null) {
            List<Object[]> rows = session.createQuery(queryString, Object[].class)
                    .setFirstResult(offset).setMaxResults(limit).getResultList();
            List<Map<String, Object>> result = new ArrayList<>();
            for (Object[] row : rows) {
                Map<String, Object> carMap = new LinkedHashMap<>();
                for (int i = 0; i < params.getSelectFields().size(); i++)
                    carMap.put(params.getSelectFields().get(i), row[i]);
                result.add(carMap);
            }
            return new PagesWrapper(result, page, totalPages, totalItems);
        } else {
            List<Car> rows = session.createQuery(queryString, Car.class)
                    .setFirstResult(offset).setMaxResults(limit).getResultList();
            return new PagesWrapper(rows, page, totalPages, totalItems);
        }
    }

    public static Car getCarFromVin(String vin) throws HibernateException {
        Session session = HibernateUtil.getSessionFactory().openSession();
        return session.get(Car.class, vin);
    }

    public static Map<String, Object> getCarFromVinSelect(String vin, ParsedQueryParams params) throws HibernateException, QueryParamException {
        params.setVinFilter(vin);

        List<String> selectFields = params.getSelectFields();

        String query = (selectFields != null ? "SELECT " + params.getSelectClause() + " " : "") 
                     + "FROM Car c" + params.getFilterClause();

        Session session = HibernateUtil.getSessionFactory().openSession();

        Object[] row;
        if (selectFields.size() == 1) {
            Object single = session.createQuery(query, Object.class).uniqueResult();
            row = new Object[]{ single };
        } else {
            row = session.createQuery(query, Object[].class).uniqueResult();
        }
        if (row == null) return null;
        Map<String, Object> carMap = new LinkedHashMap<>();
        for (int i = 0; i < selectFields.size(); i++)
            carMap.put(selectFields.get(i), row[i]);
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
}
