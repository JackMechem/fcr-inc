package com.inc.fcr.payment;

import com.fasterxml.jackson.databind.JsonNode;
import com.inc.fcr.car.Car;
import com.inc.fcr.mail.MailController;
import com.inc.fcr.user.User;
import com.inc.fcr.reservation.Reservation;
import com.inc.fcr.utils.DatabaseController;
import com.inc.fcr.utils.HibernateUtil;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.checkout.SessionCreateParams;
import io.javalin.http.Context;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * HTTP handlers for Stripe payment integration endpoints.
 *
 * <p>Provides three main flows:</p>
 * <ol>
 *   <li><strong>User lookup/creation</strong> ({@code POST /stripe/user}) — finds an existing
 *       user by email or creates a new one, returning the user's FCR ID.</li>
 *   <li><strong>Checkout session</strong> ({@code POST /stripe/checkout}) — creates a hosted
 *       Stripe Checkout page with line items for one or more car rentals.</li>
 *   <li><strong>Payment intent</strong> ({@code POST /stripe/payment-intent}) — creates a
 *       Stripe PaymentIntent for use with a custom Stripe Elements UI.</li>
 *   <li><strong>Webhook</strong> ({@code POST /stripe/webhook}) — receives Stripe events
 *       ({@code checkout.session.completed}, {@code payment_intent.succeeded}) and
 *       creates the corresponding Payment and Reservation records, then sends a
 *       confirmation email via {@link com.inc.fcr.mail.MailController}.</li>
 * </ol>
 *
 * <p>Requires the following environment variables:
 * {@code STRIPE_SECRET_KEY}, {@code STRIPE_WEBHOOK_SECRET}.</p>
 */
public class StripeController {

    static {
        Stripe.apiKey = System.getenv("STRIPE_SECRET_KEY");
    }

    /**
     * POST /stripe/user
     * Looks up a user by email. If found, returns their userId.
     * If not found, creates a new user and returns the new userId.
     * Body: {
     *   "email": "john@example.com",
     *   "firstName": "John",
     *   "lastName": "Doe",
     *   "phoneNumber": "555-555-5555",
     *   "address": { "buildingNumber": "123", "streetName": "Main St", "city": "Springfield", "state": "IL", "zipCode": "62701" },
     *   "driversLicense": { "driversLicense": "D1234567", "state": "IL", "expirationDate": 1893456000, "dateOfBirth": 694224000 }
     * }
     */
    public static void findOrCreateUser(Context ctx) {
        try {
            JsonNode body = ctx.bodyAsClass(JsonNode.class);

            if (!body.has("email")) {
                ctx.status(400).json("{\"error\": \"email is required\"}");
                return;
            }

            String email = body.get("email").asText().trim();

            // Look up existing user by email
            try (org.hibernate.Session session = HibernateUtil.getSessionFactory().openSession()) {
                User existing = session.createQuery("FROM User u WHERE u.email = :email", User.class)
                        .setParameter("email", email)
                        .uniqueResult();

                if (existing != null) {
                    ctx.status(200).json("{\"userId\": " + existing.getUserId() + ", \"created\": false}");
                    return;
                }
            }

            // User not found — create one
            String[] required = {"firstName", "lastName", "phoneNumber", "address", "driversLicense"};
            for (String field : required) {
                if (!body.has(field)) {
                    ctx.status(400).json("{\"error\": \"New user requires: firstName, lastName, phoneNumber, address, driversLicense\"}");
                    return;
                }
            }

            String port = System.getenv("PORT") != null ? System.getenv("PORT") : "8080";
            String auth = "Basic " + java.util.Base64.getEncoder().encodeToString("bob:intentionallyInsecurePassword#2".getBytes());

            com.fasterxml.jackson.databind.node.ObjectNode userBody = ((com.fasterxml.jackson.databind.node.ObjectNode) body.deepCopy());
            userBody.put("dateCreated", Instant.now().toString());

            HttpResponse<String> response = HttpClient.newHttpClient().send(
                HttpRequest.newBuilder()
                    .uri(URI.create("http://localhost:" + port + "/users"))
                    .header("Content-Type", "application/json")
                    .header("Authorization", auth)
                    .header("X-API-Key", System.getenv("API_KEY") != null ? System.getenv("API_KEY") : "")
                    .POST(HttpRequest.BodyPublishers.ofString(userBody.toString()))
                    .build(),
                HttpResponse.BodyHandlers.ofString()
            );

            System.out.println("findOrCreateUser: POST /users response " + response.statusCode() + ": " + response.body());

            if (response.statusCode() != 201) {
                ctx.status(500).json("{\"error\": \"Failed to create user: " + response.body().replace("\"", "'") + "\"}");
                return;
            }

            // Fetch the newly created user to get their ID
            try (org.hibernate.Session session = HibernateUtil.getSessionFactory().openSession()) {
                User created = session.createQuery("FROM User u WHERE u.email = :email", User.class)
                        .setParameter("email", email)
                        .uniqueResult();

                if (created == null) {
                    ctx.status(500).json("{\"error\": \"User created but could not be retrieved\"}");
                    return;
                }

                ctx.status(201).json("{\"userId\": " + created.getUserId() + ", \"created\": true}");
            }

        } catch (Exception e) {
            System.err.println("findOrCreateUser error: " + e.getMessage());
            e.printStackTrace();
            ctx.status(500).json("{\"error\": \"Internal server error\"}");
        }
    }

    /**
     * POST /stripe/checkout
     * Body: {
     *   "userId": 1,
     *   "driversLicense": "D1234567",
     *   "cars": [
     *     { "vin": "VIN1", "pickUpTime": "2025-06-01T10:00:00Z", "dropOffTime": "2025-06-03T10:00:00Z" }
     *   ],
     *   "successUrl": "http://localhost:3000/success",
     *   "cancelUrl": "http://localhost:3000/cancel"
     * }
     */
    public static void createCheckoutSession(Context ctx) {
        try {
            JsonNode body = ctx.bodyAsClass(JsonNode.class);

            if (!body.has("userId") || !body.has("driversLicense") || !body.has("cars")
                    || !body.get("cars").isArray() || body.get("cars").isEmpty()) {
                ctx.status(400).json("{\"error\": \"userId, driversLicense, and cars array are required\"}");
                return;
            }

            long userId = body.get("userId").asLong();

            String successUrl = body.has("successUrl") ? body.get("successUrl").asText() : "http://localhost:3000/success";
            String cancelUrl  = body.has("cancelUrl")  ? body.get("cancelUrl").asText()  : "http://localhost:3000/cancel";

            List<SessionCreateParams.LineItem> lineItems = new ArrayList<>();

            // Metadata: store userId + per-car reservation details so the webhook can create reservations
            Map<String, String> metadata = new HashMap<>();
            metadata.put("userId", String.valueOf(userId));

            int carCount = 0;
            for (JsonNode carNode : body.get("cars")) {
                if (!carNode.has("vin") || !carNode.has("pickUpTime") || !carNode.has("dropOffTime")) {
                    ctx.status(400).json("{\"error\": \"Each car entry requires vin, pickUpTime, and dropOffTime\"}");
                    return;
                }

                String vin      = carNode.get("vin").asText();
                Instant pickUp  = Instant.parse(carNode.get("pickUpTime").asText());
                Instant dropOff = Instant.parse(carNode.get("dropOffTime").asText());

                if (dropOff.isBefore(pickUp)) {
                    ctx.status(400).json("{\"error\": \"dropOffTime cannot be before pickUpTime for VIN: " + vin + "\"}");
                    return;
                }

                Car car = (Car) DatabaseController.getOne(Car.class, vin);
                if (car == null) {
                    ctx.status(404).json("{\"error\": \"Car not found: " + vin + "\"}");
                    return;
                }

                // Calendar days inclusive of pickup day
                LocalDate pickUpDate  = pickUp.atZone(ZoneOffset.UTC).toLocalDate();
                LocalDate dropOffDate = dropOff.atZone(ZoneOffset.UTC).toLocalDate();
                long days = ChronoUnit.DAYS.between(pickUpDate, dropOffDate) + 1;

                long amountCents = Math.round(car.getPricePerDay() * days * 100);
                String label = car.getModelYear() + " " + car.getMake() + " " + car.getModel()
                        + " — " + days + " day" + (days != 1 ? "s" : "")
                        + " @ $" + String.format("%.2f", car.getPricePerDay()) + "/day";

                SessionCreateParams.LineItem.PriceData.ProductData.Builder productBuilder =
                    SessionCreateParams.LineItem.PriceData.ProductData.builder()
                        .setName(label);

                if (car.getImages() != null && !car.getImages().isEmpty()) {
                    for (String imageUrl : car.getImages()) {
                        productBuilder.addImage(imageUrl);
                    }
                }

                lineItems.add(
                    SessionCreateParams.LineItem.builder()
                        .setQuantity(1L)
                        .setPriceData(
                            SessionCreateParams.LineItem.PriceData.builder()
                                .setCurrency("usd")
                                .setUnitAmount(amountCents)
                                .setProductData(productBuilder.build())
                                .build()
                        )
                        .build()
                );

                // Store per-car details in metadata for the webhook
                metadata.put("vin_" + carCount, vin);
                metadata.put("pickUpTime_" + carCount, pickUp.toString());
                metadata.put("dropOffTime_" + carCount, dropOff.toString());
                carCount++;
            }

            metadata.put("carCount", String.valueOf(carCount));

            SessionCreateParams.Builder paramsBuilder = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                    .setSuccessUrl(successUrl)
                    .setCancelUrl(cancelUrl)
                    .putAllMetadata(metadata);

            for (SessionCreateParams.LineItem item : lineItems) {
                paramsBuilder.addLineItem(item);
            }

            Session session = Session.create(paramsBuilder.build());

            ctx.status(200).json("{\"url\": \"" + session.getUrl() + "\", \"sessionId\": \"" + session.getId() + "\"}");

        } catch (StripeException e) {
            ctx.status(500).json("{\"error\": \"" + e.getMessage().replace("\"", "'") + "\"}");
        } catch (Exception e) {
            ctx.status(500).json("{\"error\": \"Internal server error\"}");
        }
    }

    /**
     * POST /stripe/payment-intent
     * Same body as /stripe/checkout. Returns a clientSecret for use with Stripe Elements
     * on a custom checkout UI.
     * Body: {
     *   "userId": 1,
     *   "driversLicense": "D1234567",
     *   "cars": [
     *     { "vin": "VIN1", "pickUpTime": "2025-06-01T10:00:00Z", "dropOffTime": "2025-06-03T10:00:00Z" }
     *   ]
     * }
     */
    public static void createPaymentIntent(Context ctx) {
        try {
            JsonNode body = ctx.bodyAsClass(JsonNode.class);

            if (!body.has("userId") || !body.has("driversLicense") || !body.has("cars")
                    || !body.get("cars").isArray() || body.get("cars").isEmpty()) {
                ctx.status(400).json("{\"error\": \"userId, driversLicense, and cars array are required\"}");
                return;
            }

            long userId = body.get("userId").asLong();

            User user = (User) DatabaseController.getOne(User.class, userId);
            if (user == null) {
                ctx.status(404).json("{\"error\": \"User not found\"}");
                return;
            }

            // Calculate total amount across all cars
            long totalCents = 0;
            Map<String, String> metadata = new HashMap<>();
            metadata.put("userId", String.valueOf(userId));

            int carCount = 0;
            for (JsonNode carNode : body.get("cars")) {
                if (!carNode.has("vin") || !carNode.has("pickUpTime") || !carNode.has("dropOffTime")) {
                    ctx.status(400).json("{\"error\": \"Each car entry requires vin, pickUpTime, and dropOffTime\"}");
                    return;
                }

                String vin      = carNode.get("vin").asText();
                Instant pickUp  = Instant.parse(carNode.get("pickUpTime").asText());
                Instant dropOff = Instant.parse(carNode.get("dropOffTime").asText());

                if (dropOff.isBefore(pickUp)) {
                    ctx.status(400).json("{\"error\": \"dropOffTime cannot be before pickUpTime for VIN: " + vin + "\"}");
                    return;
                }

                Car car = (Car) DatabaseController.getOne(Car.class, vin);
                if (car == null) {
                    ctx.status(404).json("{\"error\": \"Car not found: " + vin + "\"}");
                    return;
                }

                LocalDate pickUpDate  = pickUp.atZone(ZoneOffset.UTC).toLocalDate();
                LocalDate dropOffDate = dropOff.atZone(ZoneOffset.UTC).toLocalDate();
                long days = ChronoUnit.DAYS.between(pickUpDate, dropOffDate) + 1;

                totalCents += Math.round(car.getPricePerDay() * days * 100);

                metadata.put("vin_" + carCount, vin);
                metadata.put("pickUpTime_" + carCount, pickUp.toString());
                metadata.put("dropOffTime_" + carCount, dropOff.toString());
                carCount++;
            }

            metadata.put("carCount", String.valueOf(carCount));

            PaymentIntent intent = PaymentIntent.create(
                PaymentIntentCreateParams.builder()
                    .setAmount(totalCents)
                    .setCurrency("usd")
                    .putAllMetadata(metadata)
                    .build()
            );

            ctx.status(200).json("{\"clientSecret\": \"" + intent.getClientSecret() + "\", \"paymentIntentId\": \"" + intent.getId() + "\"}");

        } catch (StripeException e) {
            ctx.status(500).json("{\"error\": \"" + e.getMessage().replace("\"", "'") + "\"}");
        } catch (Exception e) {
            ctx.status(500).json("{\"error\": \"Internal server error\"}");
        }
    }

    /**
     * POST /stripe/webhook
     * Called by Stripe after a successful payment. Creates reservations from session metadata.
     */
    public static void handleWebhook(Context ctx) {
        String payload   = ctx.body();
        String sigHeader = ctx.header("Stripe-Signature");
        String secret    = System.getenv("STRIPE_WEBHOOK_SECRET");

        if (secret == null || secret.isBlank()) {
            System.err.println("STRIPE_WEBHOOK_SECRET is not set");
            ctx.status(500).json("{\"error\": \"Webhook secret not configured\"}");
            return;
        }

        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, secret);
        } catch (SignatureVerificationException e) {
            System.err.println("Webhook signature verification failed: " + e.getMessage());
            ctx.status(400).json("{\"error\": \"Invalid signature\"}");
            return;
        }

        if ("payment_intent.succeeded".equals(event.getType())) {
            PaymentIntent intent;
            try {
                intent = (PaymentIntent) event.getDataObjectDeserializer()
                        .getObject()
                        .orElseThrow(() -> new RuntimeException("Could not deserialize payment intent"));
            } catch (Exception e) {
                ctx.status(400).json("{\"error\": \"" + e.getMessage() + "\"}");
                return;
            }

            // Respond immediately so Stripe doesn't retry while we process
            ctx.status(200).json("{\"received\": true}");

            String intentId = intent.getId();
            long amount = intent.getAmount();
            Map<String, String> metadata = intent.getMetadata();
            new Thread(() -> {
                try {
                    createPaymentAndReservations(intentId, amount, metadata);
                } catch (Exception e) {
                    System.err.println("Webhook processing error: " + e.getMessage());
                    e.printStackTrace();
                }
            }).start();

        } else {
            ctx.status(200).json("{\"received\": true}");
        }
    }

    /**
     * Creates a {@link com.inc.fcr.payment.Payment} record and one {@link com.inc.fcr.reservation.Reservation}
     * per car from Stripe event metadata, then sends a confirmation email.
     *
     * <p>Called by {@link #handleWebhook} for both {@code checkout.session.completed}
     * and {@code payment_intent.succeeded} events. Makes internal HTTP requests to the
     * {@code /payments} and {@code /reservations} endpoints to create records.</p>
     *
     * @param paymentId   the Stripe session or payment-intent ID (used as the payment primary key)
     * @param amountCents the total payment amount in cents
     * @param metadata    the Stripe session/intent metadata containing {@code userId},
     *                    {@code carCount}, and per-car {@code vin_N}, {@code pickUpTime_N},
     *                    {@code dropOffTime_N} entries
     * @throws Exception if any HTTP sub-request or database operation fails
     */
    private static void createPaymentAndReservations(String paymentId, long amountCents, Map<String, String> metadata) throws Exception {
        System.out.println("Webhook metadata: " + metadata);

        int carCount = Integer.parseInt(metadata.get("carCount"));
        long userId  = Long.parseLong(metadata.get("userId"));
        System.out.println("Webhook: paymentId=" + paymentId + ", userId=" + userId + ", carCount=" + carCount);

        double totalAmount = amountCents / 100.0;
        Payment payment = new Payment(totalAmount, totalAmount, Instant.now(), PaymentType.CREDIT);
        payment.setPaymentId(paymentId);
        if (DatabaseController.objectExists(payment, Payment.class)) {
            System.out.println("Webhook: payment " + paymentId + " already processed (duplicate), skipping");
            return;
        }
        DatabaseController.insert(payment);
        System.out.println("Webhook: payment inserted: " + paymentId);

        User user = (User) DatabaseController.getOne(User.class, userId);
        if (user == null) throw new RuntimeException("User not found: " + userId);

        // Step 2: Create a Reservation per car directly
        List<Long> createdReservationIds = new ArrayList<>();
        List<Payment> payments = List.of(payment);
        for (int i = 0; i < carCount; i++) {
            String vin      = metadata.get("vin_" + i);
            Instant pickUp  = Instant.parse(metadata.get("pickUpTime_" + i));
            Instant dropOff = Instant.parse(metadata.get("dropOffTime_" + i));
            System.out.println("Webhook: creating reservation for VIN=" + vin + " " + pickUp + " -> " + dropOff);

            Car car = (Car) DatabaseController.getOne(Car.class, vin);
            if (car == null) throw new RuntimeException("Car not found: " + vin);

            Reservation reservation = new Reservation(car, user, new ArrayList<>(payments), pickUp, dropOff, Instant.now());
            DatabaseController.insert(reservation);
            if (reservation.getReservationId() != null) createdReservationIds.add(reservation.getReservationId());
            System.out.println("Webhook: reservation created for VIN=" + vin);
        }

        // Step 4: Send confirmation email
        if (user != null) {
            List<Map<String, String>> carList = new java.util.ArrayList<>();
            for (int i = 0; i < carCount; i++) {
                String vin      = metadata.get("vin_" + i);
                Car car = (Car) DatabaseController.getOne(Car.class, vin);
                Map<String, String> carInfo = new java.util.HashMap<>();
                carInfo.put("vin",         vin);
                carInfo.put("make",        car != null ? car.getMake()  : "");
                carInfo.put("model",       car != null ? car.getModel() : "");
                carInfo.put("year",        car != null ? String.valueOf(car.getModelYear()) : "");
                carInfo.put("pickUpTime",  metadata.get("pickUpTime_"  + i));
                carInfo.put("dropOffTime", metadata.get("dropOffTime_" + i));
                carList.add(carInfo);
            }
            MailController.sendReservationConfirmation(user.getEmail(), user.getFirstName(), userId, paymentId, createdReservationIds, carList);
        } else {
            System.err.println("Mail: user not found for userId=" + userId + ", skipping email");
        }
    }
}
