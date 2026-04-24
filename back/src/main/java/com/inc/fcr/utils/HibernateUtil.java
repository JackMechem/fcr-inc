package com.inc.fcr.utils;

import com.inc.fcr.auth.Account;
import com.inc.fcr.auth.LoginToken;
import com.inc.fcr.car.Car;
import com.inc.fcr.payment.Payment;
import com.inc.fcr.reservation.Reservation;
import com.inc.fcr.reviews.Review;
import com.inc.fcr.user.User;
import org.hibernate.SessionFactory;
import org.hibernate.cfg.Configuration;
import org.hibernate.cfg.Environment;

/**
 * Provides a singleton Hibernate {@link SessionFactory} for the FCR application.
 *
 * <p>All database connection settings are read from environment variables:
 * {@code DB_URL}, {@code DB_USER}, {@code DB_PASSWORD}. The factory is built
 * once at class initialization and reused throughout the application lifecycle.</p>
 *
 * <p>Registered entity classes: {@link com.inc.fcr.car.Car}, {@link com.inc.fcr.user.User},
 * {@link com.inc.fcr.reservation.Reservation}, {@link com.inc.fcr.payment.Payment}.</p>
 */
public class HibernateUtil {
    private static final SessionFactory sessionFactory = buildSessionFactory();

    /**
     * Builds and configures the Hibernate {@link SessionFactory}.
     *
     * <p>Uses {@code update} DDL auto mode, meaning tables are created or altered
     * automatically to match the entity definitions. SQL is printed to stdout for
     * debugging.</p>
     *
     * @return the configured {@link SessionFactory}
     * @throws ExceptionInInitializerError if configuration or connection fails
     */
    private static SessionFactory buildSessionFactory() {
        try {
            Configuration configuration = new Configuration();

            // 1. Database Connection Settings (using your Env Vars)
            configuration.setProperty(Environment.URL, System.getenv("DB_URL"));
            configuration.setProperty(Environment.USER, System.getenv("DB_USER"));
            configuration.setProperty(Environment.PASS, System.getenv("DB_PASSWORD"));
            configuration.setProperty(Environment.DRIVER, "com.mysql.cj.jdbc.Driver");

            // Connection pool (HikariCP — bundled with Hibernate 6)
            configuration.setProperty("hibernate.connection.provider_class",
                    "org.hibernate.hikaricp.internal.HikariCPConnectionProvider");
            configuration.setProperty("hibernate.hikari.minimumIdle", "5");
            configuration.setProperty("hibernate.hikari.maximumPoolSize", "12");
            configuration.setProperty("hibernate.hikari.idleTimeout", "45000"); // 45s
            configuration.setProperty("hibernate.hikari.connectionTimeout", "15000"); // 15s
            configuration.setProperty("hibernate.hikari.maxLifetime", "900000"); // 15 min
            configuration.setProperty("hibernate.default_batch_fetch_size", "16");

            // 2. SQL Dialect - Tells Hibernate how to write MySQL-specific SQL
            configuration.setProperty(Environment.DIALECT, "org.hibernate.dialect.MySQLDialect");

            // 3. THE KEY PROPERTY: Automatically create/update the table
            // Set this to "update" so it creates the table if it doesn't exist
            configuration.setProperty(Environment.HBM2DDL_AUTO, "update");

            // 4. Optional: Show SQL in console so you can see the CREATE TABLE command
            String showSql = System.getenv("SHOW_SQL") != null ? System.getenv("SHOW_SQL") : "true";
            configuration.setProperty(Environment.SHOW_SQL, showSql);
            configuration.setProperty(Environment.FORMAT_SQL, showSql);

            // 5. Register your Entity
            configuration.addAnnotatedClass(Account.class);
            configuration.addAnnotatedClass(LoginToken.class);
            configuration.addAnnotatedClass(Car.class);
            configuration.addAnnotatedClass(User.class);
            configuration.addAnnotatedClass(Reservation.class);
            configuration.addAnnotatedClass(Payment.class);
            configuration.addAnnotatedClass(Review.class);

            return configuration.buildSessionFactory();
        } catch (Throwable ex) {
            System.err.println("Initial SessionFactory creation failed: " + ex);
            throw new ExceptionInInitializerError(ex);
        }
    }

    /**
     * Returns the application-wide {@link SessionFactory} singleton.
     *
     * @return the shared {@link SessionFactory} instance
     */
    public static SessionFactory getSessionFactory() {
        return sessionFactory;
    }
}
