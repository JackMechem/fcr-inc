package com.inc.fcr;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inc.fcr.auth.Account;
import com.inc.fcr.auth.AuthController;
import com.inc.fcr.car.Car;
import com.inc.fcr.payment.Payment;
import com.inc.fcr.payment.StripeController;
import com.inc.fcr.car.CarMakeController;
import com.inc.fcr.reservation.Reservation;
import com.inc.fcr.reviews.Review;
import com.inc.fcr.user.User;
import com.inc.fcr.utils.APIController;
import com.inc.fcr.utils.PostmanController;
import com.inc.fcr.utils.VersionController;
import com.inc.fcr.car.enums.EnumController;
import com.inc.fcr.utils.HibernateUtil;

import io.javalin.Javalin;

import static io.javalin.apibuilder.ApiBuilder.*;

/**
 * Application entry point for the FCR Inc car rental REST API.
 *
 * <p>Bootstraps Hibernate, configures a Javalin HTTP server with role-based access
 * control, then registers all API routes.</p>
 *
 * <p>The server port is read from the {@code PORT} environment variable,
 * defaulting to {@code 8080} if not set.</p>
 *
 * <p><strong>Route overview:</strong></p>
 * <ul>
 *   <li>{@code GET  /auth/validate}                  — validate a Bearer session token</li>
 *   <li>{@code POST /auth/register}                  — create an account (optionally creates a linked user)</li>
 *   <li>{@code GET  /auth/confirm/{token}}            — confirm email and receive a session token</li>
 *   <li>{@code POST /auth/send-link}                 — send a magic login link to a confirmed account</li>
 *   <li>{@code GET  /auth/account-exists?email=...}  — check if an account exists (200 or 404)</li>
 *   <li>{@code GET|PATCH|DELETE /accounts/{id}}      — manage accounts (READ/WRITE/ADMIN)</li>
 *   <li>{@code GET /accounts}                        — list/search accounts (READ)</li>
 *   <li>{@code GET|POST /cars}                       — list or create vehicles</li>
 *   <li>{@code GET /cars/makes}                      — distinct car makes</li>
 *   <li>{@code GET|PATCH|DELETE /cars/{id}}          — manage a vehicle</li>
 *   <li>{@code GET|POST /reservations}               — list or create reservations</li>
 *   <li>{@code GET|PATCH|DELETE /reservations/{id}}  — manage a reservation</li>
 *   <li>{@code GET|POST /users}                      — list or create users</li>
 *   <li>{@code GET|PATCH|DELETE /users/{id}}         — manage a user</li>
 *   <li>{@code GET|POST /payments}                   — list or create payments</li>
 *   <li>{@code GET|PATCH|DELETE /payments/{id}}      — manage a payment</li>
 *   <li>{@code POST /stripe/user}                    — find or create a user by email</li>
 *   <li>{@code POST /stripe/checkout}                — create a hosted Stripe Checkout session</li>
 *   <li>{@code POST /stripe/payment-intent}          — create a Stripe PaymentIntent</li>
 *   <li>{@code POST /stripe/webhook}                 — handle Stripe payment events</li>
 *   <li>{@code GET  /enums}                          — all enum metadata for UI dropdowns</li>
 *   <li>{@code GET  /enums/{enum}}                   — metadata for a specific enum</li>
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

            ObjectMapper mapper = new ObjectMapper().findAndRegisterModules();

            // Create controllers
            APIController accounts = new APIController(Account.class, Long.class);
            APIController cars = new APIController(Car.class, String.class);
            APIController reservations = new APIController(Reservation.class, Long.class);
            APIController users = new APIController(User.class, Long.class);
            APIController payments = new APIController(Payment.class, String.class);
            APIController reviews = new APIController(Review.class, Long.class);


            // Initialize endpoints
            config.router.mount(router -> {
                router.beforeMatched(Auth::handleAccess);
            }).apiBuilder(() -> {
                // Default redirect (/cars)
                get("/", ctx -> ctx.redirect("/cars"), Role.ANYONE);

                // Validate auth credentials
                get("/auth/validate", Auth::validateCredentials, Role.ANYONE);

                path("auth", () -> {
                    // POST /auth/register   { "email", "role"?, ...user fields }
                    post("/register", AuthController::register, Role.ANYONE);
                    // GET  /auth/confirm/{token}
                    path("/confirm/{token}", () -> get(AuthController::confirmEmail, Role.ANYONE));
                    // POST /auth/send-link  { "email" }
                    post("/send-link", AuthController::sendLink, Role.ANYONE);
                    // GET  /auth/account-exists?email=...  → 200 or 404, no body
                    get("/account-exists", AuthController::accountExists, Role.ANYONE);
                });

                // Accounts — created via POST /auth/register; managed here
                path("accounts", () -> {
                    get(accounts::getAll, Role.READ);
                    path("{id}", () -> {
                        get(accounts::getOne, Role.READ);
                        patch(ctx -> Auth.verifiedAccountAPIHandler(accounts::update, Role.WRITE, ctx,
                                Long.parseLong(ctx.pathParam("id"))), Role.READ);
                        delete(accounts::delete, Role.ADMIN);
                    });
                });

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

                path("reviews", () -> {
                    get(reviews::getAll, Role.ANYONE);
                    post(ctx -> Auth.verifiedAccountAPIHandler(reviews::create, Role.WRITE, ctx,
                            mapper.readTree(ctx.body()).path("account").asLong(-1)), Role.READ);
                    path("{id}", () -> {
                        get(reviews::getOne, Role.ANYONE);
                        patch(ctx -> Auth.verifiedAccountObjAPIHandler(reviews::update, Role.WRITE, ctx, reviews), Role.READ);
                        delete(ctx -> Auth.verifiedAccountObjAPIHandler(reviews::delete, Role.ADMIN, ctx, reviews), Role.READ);
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

                // GET /postman — returns a Postman collection JSON for import
                get("/postman", PostmanController::getCollection, Role.ANYONE);

                // GET /version — returns the current API version
                get("/version", VersionController::getVersion, Role.ANYONE);
            });
        }).start(port);
    }
}
