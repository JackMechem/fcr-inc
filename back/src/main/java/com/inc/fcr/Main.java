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

public class Main {
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
                path("enums", () -> { // /enums or enums?
                    get(EnumController::getAllEnums, Role.ANYONE);
                    path("{enum}", () -> {
                        get(EnumController::getEnum, Role.ANYONE);
                    });
                });
            });
        }).start(port);
    }
}
