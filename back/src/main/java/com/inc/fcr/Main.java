package com.inc.fcr;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inc.fcr.car.Car;
import com.inc.fcr.payment.Payment;
import com.inc.fcr.payment.StripeController;
import com.inc.fcr.car.CarMakeController;
import com.inc.fcr.reservation.Reservation;
import com.inc.fcr.user.User;
import com.inc.fcr.utils.APIController;
import com.inc.fcr.car.enums.EnumController;
import com.inc.fcr.utils.DatabaseController;
import com.inc.fcr.utils.HibernateUtil;

import io.javalin.Javalin;

import static io.javalin.apibuilder.ApiBuilder.*;

/**
 * Application entry point for the FCR Inc car rental REST API.
 *
 * <p>Bootstraps Hibernate, configures a Javalin HTTP server with
 * documentation, CORS, and role-based access control, then registers all API routes.</p>
 *
 * <p>The server port is read from the {@code PORT} environment variable,
 * defaulting to {@code 8080} if not set.</p>
 *
 * <p><strong>Route overview:</strong></p>
 * <ul>
 *   <li>{@code /cars}         — CRUD for vehicle inventory</li>
 *   <li>{@code /reservations} — CRUD for reservations</li>
 *   <li>{@code /users}        — CRUD for users</li>
 *   <li>{@code /payments}     — CRUD for payment records</li>
 *   <li>{@code /stripe}       — Stripe checkout / webhook integration</li>
 *   <li>{@code /enums}        — Enum metadata for UI dropdowns</li>
 *   <li>{@code /auth/validate}— Credential validation</li>
 * </ul>
 */
public class Main {
    /**
     * Starts the Javalin HTTP server and registers all routes.
     *
     * @param args command-line arguments (unused)
     * @throws Exception if Hibernate or Javalin initialization fails
     */
    public static void main(String[] args) throws Exception {

        HibernateUtil.getSessionFactory();

        // Check for the "PORT" environment variable, default to 8080 if not found
        String portProperty = System.getenv("PORT");
        int port = (portProperty != null) ? Integer.parseInt(portProperty) : 8080;

        Javalin app = Javalin.create(config -> {

            // Create controllers
            APIController cars = new APIController(Car.class, String.class);
            APIController reservations = new APIController(Reservation.class, Long.class);
            APIController users = new APIController(User.class, Long.class);
            APIController payments = new APIController(Payment.class, String.class);

            // Initialize endpoints
            config.router.mount(router -> {
                router.beforeMatched(Auth::handleAccess);
            }).apiBuilder(() -> {
                // Default redirect (/cars)
                get("/", ctx -> ctx.redirect("/cars"), Role.ANYONE);

                // Validate auth credentials
                get("/auth/validate", Auth::validateCredentials, Role.ANYONE);

                path("cars", () -> {
                    get(cars::getAll, Role.ANYONE);
                    post(cars::create, Role.WRITE);
                    path("/makes", () -> {
                        get(CarMakeController::getDistinctMakes, Role.ANYONE);
                    });
                    path("{id}", () -> {
                        get(cars::getOne, Role.ANYONE);
                        patch(cars::update, Role.WRITE);
                        delete(cars::delete, Role.ADMIN);
                    });
                });

                path("reservations", () -> {
                    get(reservations::getAll, Role.ANYONE);
                    post(reservations::create, Role.WRITE);
                    path("{id}", () -> {
                        get(reservations::getOne, Role.ANYONE);
                        patch(reservations::update, Role.WRITE);
                        delete(reservations::delete, Role.ADMIN);
                    });
                });

                path("users", () -> {
                    get(users::getAll, Role.ANYONE);
                    post(users::create, Role.WRITE);
                    path("{id}", () -> {
                        get(users::getOne, Role.ANYONE);
                        patch(users::update, Role.WRITE);
                        delete(users::delete, Role.ADMIN);
                    });
                });

                path("payments", () -> {
                    get(payments::getAll, Role.ANYONE);
                    post(payments::create, Role.WRITE);
                    path("{id}", () -> {
                        get(payments::getOne, Role.ANYONE);
                        patch(payments::update, Role.WRITE);
                        delete(payments::delete, Role.ADMIN);
                    });
                });

                path("stripe", () -> {
                    post("/user", StripeController::findOrCreateUser, Role.ANYONE);
                    post("/checkout", StripeController::createCheckoutSession, Role.ANYONE);
                    post("/payment-intent", StripeController::createPaymentIntent, Role.ANYONE);
                    post("/webhook", StripeController::handleWebhook, Role.ANYONE);
                });

                // redirect to enums (/enums) and (/enums{enum})
                path("enums", () -> {
                    get(EnumController::getAllEnums, Role.ANYONE);
                    path("{enum}", () -> {
                        get(EnumController::getEnum, Role.ANYONE);
                    });
                });
            });
        }).start(port);
    }
}
