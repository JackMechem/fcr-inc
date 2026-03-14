package com.inc.fcr.database;

import com.inc.fcr.car.Car;
import com.inc.fcr.car.CarPagesWrapper;

import org.hibernate.Session;
import org.hibernate.Transaction;
import com.inc.fcr.utils.HibernateUtil;
import java.util.List;

public class DatabaseController {

    /*
     * GET
     */

    private static final int DEFAULT_PAGE_SIZE = 10;

    public static CarPagesWrapper getCarDB(int page, int pageSize) throws RuntimeException {
        int currentPage = (page <= 0) ? 1 : page;
        int limit = (pageSize <= 0) ? DEFAULT_PAGE_SIZE : pageSize;
        int offset = (currentPage - 1) * limit;

        Session session = HibernateUtil.getSessionFactory().openSession();
        Long totalItems = session.createQuery("SELECT count(c) FROM Car c", Long.class)
                .getSingleResult();

        List<Car> cars = session.createQuery("FROM Car", Car.class)
                .setFirstResult(offset)
                .setMaxResults(limit)
                .getResultList();

        int totalPages = (int) Math.ceil((double) totalItems / limit);

        return new CarPagesWrapper(cars, currentPage, totalPages, totalItems);

    }

    public static Car getCarFromVin(String vin) throws RuntimeException {
        Session session = HibernateUtil.getSessionFactory().openSession();
        Car car = session.get(Car.class, vin);
        return car;
    }

    /*
     * INSERT & UPDATE
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
     * DELETE
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

}
