package com.inc.fcr.reservation;

import com.inc.fcr.database.PagesWrapper;
import com.inc.fcr.errorHandling.ValidationException;
import com.inc.fcr.utils.HibernateUtil;
import org.hibernate.HibernateException;
import org.hibernate.Session;
import org.hibernate.Transaction;

public class ReservationDataController {

    // TODO
    public static PagesWrapper getReservations() throws HibernateException {
        return null;
    }

    public static Reservation getReservation(long id) throws HibernateException {
        Session session = HibernateUtil.getSessionFactory().openSession();
        return session.get(Reservation.class, id);
    }

    public static void insertReservation(Reservation res) throws HibernateException, ValidationException {
        insertUpdateReservation(res, true);
    }

    public static void updateReservation(Reservation res) throws HibernateException, ValidationException {
        insertUpdateReservation(res, false);
    }

    public static void insertUpdateReservation(Reservation res, boolean inserting) throws HibernateException, ValidationException {
        Transaction transaction = null;
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            transaction = session.beginTransaction();

            Reservation existingRes = session.get(Reservation.class, res.getReservationId());
            boolean exists = (existingRes != null);

            if (inserting && exists) {
                throw new ValidationException("Reservation " + res.getReservationId() + " already exists.");
            }
            if (!inserting && !exists) {
                throw new ValidationException("Reservation " + res.getReservationId() + " doesn't exist.");
            }

            session.merge(res);

            transaction.commit();
            System.out.println("Reservation successfully " + (inserting ? "inserted" : "updated") + ".");

        } catch (Exception e) {
            if (transaction != null) transaction.rollback();
            throw e;
        }
    }

    public static void deleteReservation(long id) throws HibernateException, ValidationException {
        Session session = HibernateUtil.getSessionFactory().openSession();
        Reservation res = session.get(Reservation.class, id);

        if (res != null) {
            Transaction transaction = session.beginTransaction();
            session.remove(res);
            transaction.commit();
            System.out.println("Reservation " + id + " was deleted.");
        } else {
            throw new ValidationException("Reservation not found.");
        }
    }
}
