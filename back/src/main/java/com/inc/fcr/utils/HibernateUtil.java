package com.inc.fcr.utils;

import com.inc.fcr.car.Car;
import com.inc.fcr.reservation.Reservation;
import com.inc.fcr.user.User;
import org.hibernate.SessionFactory;
import org.hibernate.cfg.Configuration;
import org.hibernate.cfg.Environment;

public class HibernateUtil {
    private static final SessionFactory sessionFactory = buildSessionFactory();

    private static SessionFactory buildSessionFactory() {
        try {
            Configuration configuration = new Configuration();

            // 1. Database Connection Settings (using your Env Vars)
            configuration.setProperty(Environment.URL, System.getenv("DB_URL"));
            configuration.setProperty(Environment.USER, System.getenv("DB_USER"));
            configuration.setProperty(Environment.PASS, System.getenv("DB_PASSWORD"));
            configuration.setProperty(Environment.DRIVER, "com.mysql.cj.jdbc.Driver");

            // 2. SQL Dialect - Tells Hibernate how to write MySQL-specific SQL
            configuration.setProperty(Environment.DIALECT, "org.hibernate.dialect.MySQLDialect");

            // 3. THE KEY PROPERTY: Automatically create/update the table
            // Set this to "update" so it creates 'carstest' if it doesn't exist
            configuration.setProperty(Environment.HBM2DDL_AUTO, "update");

            // 4. Optional: Show SQL in console so you can see the CREATE TABLE command
            configuration.setProperty(Environment.SHOW_SQL, "true");
            configuration.setProperty(Environment.FORMAT_SQL, "true");

            // 5. Register your Entity
            configuration.addAnnotatedClass(Car.class);
            configuration.addAnnotatedClass(User.class);
            configuration.addAnnotatedClass(Reservation.class);

            return configuration.buildSessionFactory();
        } catch (Throwable ex) {
            System.err.println("Initial SessionFactory creation failed: " + ex);
            throw new ExceptionInInitializerError(ex);
        }
    }

    public static SessionFactory getSessionFactory() {
        return sessionFactory;
    }
}
