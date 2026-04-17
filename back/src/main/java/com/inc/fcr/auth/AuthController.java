package com.inc.fcr.auth;

import com.inc.fcr.mail.MailController;
import com.inc.fcr.user.Address;
import com.inc.fcr.user.DriversLicense;
import com.inc.fcr.user.User;
import com.inc.fcr.utils.HibernateUtil;
import io.javalin.http.BadRequestResponse;
import io.javalin.http.ConflictResponse;
import io.javalin.http.Context;
import io.javalin.http.NotFoundResponse;
import org.hibernate.Session;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Handles account registration and magic-link authentication for the FCR system.
 *
 * <h2>Flow</h2>
 * <ol>
 *   <li>{@code POST /auth/register} — creates an {@link Account} linked to an existing
 *       {@code stripe_users} record (looked up by email) and emails a confirmation link.</li>
 *   <li>{@code GET /auth/confirm/{token}} — validates the link, marks the account confirmed,
 *       and returns a Bearer session token.</li>
 *   <li>{@code POST /auth/send-link} — sends a fresh login link to any confirmed account.</li>
 * </ol>
 *
 * <p>Bearer tokens are validated by {@link com.inc.fcr.Auth#bearerTokenRoles} on every request.</p>
 */
public class AuthController {

    /** How long an emailed confirmation link stays valid. */
    private static final long LINK_TTL_HOURS = 24;
    /** How long a Bearer session token stays valid. */
    private static final long SESSION_TTL_DAYS = 7;

    /**
     * {@code POST /auth/register}
     *
     * <p>Creates a login {@link Account} and optionally a linked {@link User} record.
     * Accepts:</p>
     * <pre>
     * {
     *   "email":       "...",          // required
     *   "role":        "CUSTOMER",     // optional, defaults to CUSTOMER
     *   "firstName":   "...",          // optional — used to create a new User if none exists
     *   "lastName":    "...",          // optional
     *   "phoneNumber": "...",          // optional
     *   "address": {                   // optional
     *     "buildingNumber": "...",
     *     "streetName":     "...",
     *     "city":           "...",
     *     "state":          "...",
     *     "zipCode":        "..."
     *   },
     *   "driversLicense": {            // optional
     *     "driversLicense": "...",
     *     "state":          "...",
     *     "expirationDate": 0,
     *     "dateOfBirth":    0
     *   }
     * }
     * </pre>
     *
     * <p>If a {@code stripe_users} record already exists for the email, it is linked
     * automatically and any provided user fields are ignored. If no record exists and
     * all user fields ({@code firstName}, {@code lastName}, {@code phoneNumber},
     * {@code address}, {@code driversLicense}) are provided, a new {@code User} is created.
     * If no record exists and user fields are omitted, the account is created without a
     * linked user.</p>
     *
     * @param ctx the Javalin request context
     * @throws BadRequestResponse if required fields are missing or invalid
     * @throws ConflictResponse   if an account already exists for this email
     */
    public static void register(Context ctx) {
        @SuppressWarnings("unchecked")
        Map<String, Object> body = ctx.bodyAsClass(Map.class);

        Object rawEmail = body.get("email");
        if (rawEmail == null) throw new BadRequestResponse("email is required");
        String email = rawEmail.toString().trim();
        if (email.isBlank()) throw new BadRequestResponse("email is required");

        String roleStr = body.containsKey("role") ? body.get("role").toString() : "CUSTOMER";
        AccountRole role;
        try {
            role = AccountRole.valueOf(roleStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestResponse("Invalid role. Must be CUSTOMER, STAFF, or ADMIN.");
        }

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {

            // Prevent duplicate accounts
            Long count = session.createQuery(
                    "SELECT count(a) FROM Account a WHERE a.email = :email", Long.class)
                    .setParameter("email", email).uniqueResult();
            if (count != null && count > 0)
                throw new ConflictResponse("An account is already registered for this email.");

            // Look up an existing user by email — if found, link them and ignore provided fields.
            User user = session.createQuery("FROM User WHERE email = :email", User.class)
                    .setParameter("email", email).uniqueResult();

            if (user == null) {
                // Attempt to create a User from provided fields if all are present.
                String firstName   = getString(body, "firstName");
                String lastName    = getString(body, "lastName");
                String phoneNumber = getString(body, "phoneNumber");

                @SuppressWarnings("unchecked")
                Map<String, Object> rawAddress = (Map<String, Object>) body.get("address");
                @SuppressWarnings("unchecked")
                Map<String, Object> rawLicense = (Map<String, Object>) body.get("driversLicense");

                boolean hasUserFields = firstName != null || lastName != null
                        || phoneNumber != null || rawAddress != null || rawLicense != null;

                if (hasUserFields) {
                    if (firstName == null || lastName == null || phoneNumber == null
                            || rawAddress == null || rawLicense == null) {
                        throw new BadRequestResponse(
                                "To create a user record, all user fields are required: " +
                                "firstName, lastName, phoneNumber, address, driversLicense.");
                    }

                    Address address = new Address(
                            getString(rawAddress, "buildingNumber"),
                            getString(rawAddress, "streetName"),
                            getString(rawAddress, "city"),
                            getString(rawAddress, "state"),
                            getString(rawAddress, "zipCode"));

                    DriversLicense license = new DriversLicense(
                            getString(rawLicense, "driversLicense"),
                            getString(rawLicense, "state"),
                            toLong(rawLicense.get("expirationDate")),
                            toLong(rawLicense.get("dateOfBirth")));

                    user = new User(firstName, lastName, email, phoneNumber, address, license, Instant.now());
                    var tx = session.beginTransaction();
                    session.persist(user);
                    tx.commit();
                }
            }

            String name = user != null
                    ? user.getFirstName() + " " + user.getLastName()
                    : getString(body, "name");
            if (name == null || name.isBlank())
                throw new BadRequestResponse("name is required when no user details are provided.");

            Account account = new Account(name, email, Instant.now(), user, role);

            var tx = session.beginTransaction();
            session.persist(account);
            tx.commit();

            LoginToken lt = buildToken(account.getAcctId(), email,
                    LINK_TTL_HOURS, ChronoUnit.HOURS, SESSION_TTL_DAYS, ChronoUnit.DAYS);
            var tx2 = session.beginTransaction();
            session.persist(lt);
            tx2.commit();

            String firstName = user != null ? user.getFirstName() : name;
            MailController.sendAccountConfirmation(email, firstName, lt.getToken());
        }

        ctx.status(201).json(Map.of("message", "Account created. Check your email to confirm."));
    }

    private static String getString(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val == null) return null;
        String s = val.toString().trim();
        return s.isBlank() ? null : s;
    }

    private static long toLong(Object val) {
        if (val == null) throw new BadRequestResponse("Missing numeric field in driversLicense.");
        if (val instanceof Number n) return n.longValue();
        try { return Long.parseLong(val.toString()); }
        catch (NumberFormatException e) { throw new BadRequestResponse("Invalid numeric field in driversLicense."); }
    }

    /**
     * {@code GET /auth/confirm/{token}}
     *
     * <p>Validates a confirmation token, marks the account's email confirmed, and
     * returns a Bearer session token. Works for both initial confirmation and
     * subsequent magic-link logins.</p>
     *
     * @param ctx the Javalin request context
     * @throws NotFoundResponse if the token is invalid, already used, or expired
     */
    public static void confirmEmail(Context ctx) {
        String tokenStr = ctx.pathParam("token");

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            LoginToken lt = session.createQuery(
                    "FROM LoginToken WHERE token = :t AND type = 'ACCOUNT_CONFIRM'", LoginToken.class)
                    .setParameter("t", tokenStr).uniqueResult();

            if (lt == null) throw new NotFoundResponse("Invalid or expired token");
            if (lt.getVerifiedAt() != null) throw new NotFoundResponse("Token has already been used");
            if (Instant.now().isAfter(lt.getExpiresAt())) throw new NotFoundResponse("Token has expired");

            Account account = session.get(Account.class, lt.getAccountId());
            if (account == null) throw new NotFoundResponse("Account not found");

            LoginToken sessionTok = buildToken(account.getAcctId(), lt.getEmail(),
                    SESSION_TTL_DAYS, ChronoUnit.DAYS, SESSION_TTL_DAYS, ChronoUnit.DAYS);
            sessionTok.setType("ACCOUNT_SESSION");

            var tx = session.beginTransaction();
            lt.setVerifiedAt(Instant.now());
            if (account.getDateEmailConfirmed() == null) account.setDateEmailConfirmed(Instant.now());
            session.merge(lt);
            session.merge(account);
            session.persist(sessionTok);
            tx.commit();

            Map<String, Object> response = new HashMap<>();
            response.put("token", sessionTok.getToken());
            response.put("acctId", account.getAcctId());
            response.put("role", account.getRole().name());
            response.put("sessionExpiresAt", sessionTok.getSessionExpiresAt().toString());
            User user = account.getUser();
            if (user != null) response.put("userId", user.getUserId());

            ctx.status(200).json(response);
        }
    }

    /**
     * {@code GET /auth/account-exists?email=...}
     *
     * <p>Returns {@code 200} if a confirmed or unconfirmed account exists for the given email,
     * {@code 404} otherwise. No account data is returned. Accessible without authentication.</p>
     *
     * @param ctx the Javalin request context
     * @throws BadRequestResponse if the {@code email} query parameter is missing
     */
    public static void accountExists(Context ctx) {
        String email = ctx.queryParam("email");
        if (email == null || email.isBlank()) throw new BadRequestResponse("email query parameter is required");
        email = email.trim();

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            Long count = session.createQuery(
                    "SELECT count(a) FROM Account a WHERE a.email = :email", Long.class)
                    .setParameter("email", email).uniqueResult();
            if (count != null && count > 0) ctx.status(200);
            else ctx.status(404);
        }
    }

    /**
     * {@code POST /auth/send-link}
     *
     * <p>Sends a fresh login link to any confirmed account. Accepts
     * {@code { "email": "..." }}. Always responds {@code 200} to prevent
     * email enumeration.</p>
     *
     * @param ctx the Javalin request context
     */
    public static void sendLink(Context ctx) {
        @SuppressWarnings("unchecked")
        Map<String, Object> body = ctx.bodyAsClass(Map.class);
        Object rawEmail = body.get("email");
        if (rawEmail == null) throw new BadRequestResponse("email is required");
        String email = rawEmail.toString().trim();

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            Account account = session.createQuery(
                    "FROM Account WHERE email = :email", Account.class)
                    .setParameter("email", email).uniqueResult();

            if (account != null && account.getDateEmailConfirmed() != null) {
                LoginToken lt = buildToken(account.getAcctId(), email,
                        LINK_TTL_HOURS, ChronoUnit.HOURS, SESSION_TTL_DAYS, ChronoUnit.DAYS);
                var tx = session.beginTransaction();
                session.persist(lt);
                tx.commit();
                String firstName = account.getUser() != null ? account.getUser().getFirstName() : account.getName();
                MailController.sendAccountConfirmation(email, firstName, lt.getToken());
            }
        }

        ctx.status(200).json(Map.of("message", "If that email has a confirmed account, a login link has been sent."));
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Constructs and populates a new {@link LoginToken} of type {@code ACCOUNT_CONFIRM}
     * without persisting it.
     *
     * @param accountId      the {@link Account#getAcctId()} this token belongs to
     * @param email          email address for this token
     * @param linkTtlAmount  time until the link expires
     * @param linkTtlUnit    unit for {@code linkTtlAmount}
     * @param sessionTtlDays session validity after the token is used
     * @param sessionTtlUnit unit for {@code sessionTtlDays}
     * @return the constructed (unpersisted) token
     */
    private static LoginToken buildToken(long accountId, String email,
                                         long linkTtlAmount, ChronoUnit linkTtlUnit,
                                         long sessionTtlDays, ChronoUnit sessionTtlUnit) {
        Instant now = Instant.now();
        LoginToken lt = new LoginToken();
        lt.setToken(UUID.randomUUID().toString());
        lt.setType("ACCOUNT_CONFIRM");
        lt.setAccountId(accountId);
        lt.setEmail(email);
        lt.setCreatedAt(now);
        lt.setExpiresAt(now.plus(linkTtlAmount, linkTtlUnit));
        lt.setSessionExpiresAt(now.plus(sessionTtlDays, sessionTtlUnit));
        return lt;
    }
}
