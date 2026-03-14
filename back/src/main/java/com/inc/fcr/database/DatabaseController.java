package com.inc.fcr.database;

import com.inc.fcr.car.Car;

import java.util.ArrayList;
import org.hibernate.Session;
import org.hibernate.Transaction;
import org.hibernate.query.Query;
import com.inc.fcr.utils.HibernateUtil;
import java.util.List;

public class DatabaseController {

    /*
     * GET
     */

    private static final int DEFAULT_PAGE_SIZE = 10;

    public static List<Car> getCarDB(int page, int pageSize) {
        int currentPage = (page <= 0) ? 1 : page;
        int limit = (pageSize <= 0) ? DEFAULT_PAGE_SIZE : pageSize;
        int offset = (currentPage - 1) * limit;

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            Query<Car> query = session.createQuery("FROM Car", Car.class);

            query.setFirstResult(offset);
            query.setMaxResults(limit);

            return query.getResultList();
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    public static Car getCarFromVin(String vin) {
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {

            Car car = session.get(Car.class, vin);

            return car;

        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    /*
     * INSERT & UPDATE
     */

    public static void insertCar(Car car) throws Exception {
        insertUpdateCar(car, true);
    }

    public static void updateCar(Car car) throws Exception {
        insertUpdateCar(car, false);
    }

    public static void insertUpdateCar(Car car, boolean insertingCar) throws Exception {
        Transaction transaction = null;
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            transaction = session.beginTransaction();

            Car existingCar = session.get(Car.class, car.getVin());
            boolean carInDB = (existingCar != null);

            if (insertingCar && carInDB) {
                throw new Exception("Car with VIN " + car.getVin() + " already exists.");
            }
            if (!insertingCar && !carInDB) {
                throw new Exception("Car with VIN " + car.getVin() + " doesn't exist.");
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

    public static void deleteCar(String vin) {
        Transaction transaction = null;
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            transaction = session.beginTransaction();

            Car car = session.get(Car.class, vin);

            if (car != null) {
                session.remove(car);
                System.out.println("Car with VIN " + vin + " was deleted.");
            } else {
                System.out.println("No car found with VIN: " + vin);
            }

            transaction.commit();

        } catch (Exception e) {
            if (transaction != null) {
                transaction.rollback();
            }
            e.printStackTrace();
        }
    }

}
