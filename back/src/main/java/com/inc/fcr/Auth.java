package com.inc.fcr;

import com.inc.fcr.auth.Account;
import com.inc.fcr.auth.AccountRole;
import com.inc.fcr.auth.LoginToken;
import com.inc.fcr.errorHandling.ApiErrors;
import com.inc.fcr.reviews.Review;
import com.inc.fcr.utils.APIController;
import com.inc.fcr.utils.DatabaseController;
import com.inc.fcr.utils.HibernateUtil;
import io.javalin.http.*;
import io.javalin.security.RouteRole;
import org.hibernate.Session;
import org.jetbrains.annotations.NotNull;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * Handles HTTP Basic authentication and role-based access control for the FCR API.
 *
 * <p>This class is registered as a Javalin {@code beforeMatched} handler in {@link Main}.
 * Every incoming request passes through {@link #handleAccess(Context)} before reaching
 * its route handler.</p>
 *
 * <p><strong>Note:</strong> The credential store ({@link #userRolesMap}) is a temporary
 * hard-coded map and is intended to be replaced with a proper authentication mechanism
 * (API keys or user logins) in the future.</p>
 */
public class Auth {

    /**
     * Javalin {@code beforeMatched} handler that enforces role-based access control.
     *
     * <p>If the matched route permits {@link Role#ANYONE}, the request passes through
     * immediately. Otherwise, the caller's Basic auth credentials are checked against
     * {@link #userRolesMap}. A {@code 401 Unauthorized} response is sent if the user
     * has no matching role.</p>
     *
     * @param ctx the Javalin request context
     * @throws UnauthorizedResponse if the caller lacks a required role
     */
    public static void handleAccess(Context ctx) {
        Set<RouteRole> permittedRoles = ctx.routeRoles();
        // check if context requires (permitted) roles
        if (permittedRoles.contains(Role.ANYONE)) {
            return;
        } // anyone can access
        ApiKeyAuth.check(ctx);
        if (userRoles(ctx).stream().anyMatch(permittedRoles::contains)) {
            return;
        } // user has required role
          // else auth error
        ctx.header(Header.WWW_AUTHENTICATE, "Basic");
        throw new UnauthorizedResponse();
    }

    /**
     * Route handler for {@code GET /auth/validate}.
     *
     * <p>Returns {@code 200 OK} if the provided Basic auth credentials are valid,
     * or {@code 401 Unauthorized} otherwise. Useful for login checks from clients.</p>
     *
     * @param ctx the Javalin request context
     * @throws UnauthorizedResponse if credentials are missing or invalid
     */
    public static void validateCredentials(Context ctx) {
        if (!userRoles(ctx).isEmpty()) {
            ctx.status(200);
        } else {
            ctx.header(Header.WWW_AUTHENTICATE, "Basic");
            throw new UnauthorizedResponse();
        }
    }

    /**
     * Returns the list of {@link Role}s associated with the Basic auth credentials
     * present in the request, or an empty list if credentials are absent or unrecognized.
     *
     * @param ctx the Javalin request context
     * @return a non-null list of roles granted to the caller
     */
    public static List<Role> userRoles(Context ctx) {
        // Check hardcoded Basic auth first (existing behaviour)
        List<Role> basicRoles = Optional.ofNullable(ctx.basicAuthCredentials())
                .map(credentials -> userRolesMap
                        .getOrDefault(new Pair(credentials.getUsername(), credentials.getPassword()), List.of()))
                .orElse(List.of());
        if (!basicRoles.isEmpty()) return basicRoles;

        // Fall through to Bearer token (Account sessions)
        return bearerTokenRoles(ctx);
    }

    /**
     * Checks the {@code Authorization: Bearer <token>} header against the
     * {@code auth_login_tokens} table. Returns roles based on the linked
     * {@link Account}'s {@link AccountRole} if the session is valid.
     *
     * @param ctx the Javalin request context
     * @return a non-null list of roles, empty if the token is absent or invalid
     */
    private static List<Role> bearerTokenRoles(Context ctx) {
        String authHeader = ctx.header(Header.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return List.of();
        String tokenStr = authHeader.substring(7).trim();
        if (tokenStr.isBlank()) return List.of();

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            LoginToken lt = session.createQuery(
                    "FROM LoginToken WHERE token = :t AND type = 'ACCOUNT_SESSION'", LoginToken.class)
                    .setParameter("t", tokenStr).uniqueResult();

            if (lt == null || Instant.now().isAfter(lt.getSessionExpiresAt())) return List.of();

            Account account = session.get(Account.class, lt.getAccountId());

            if (account != null && account.getDateEmailConfirmed() != null) {
                return rolesForAccountRole(account.getRole());
            }
        } catch (Exception e) {
            System.err.println("Auth: Bearer token lookup failed — " + e.getMessage());
        }
        return List.of();
    }

    /**
     * Returns the account ID associated with the Bearer token in the request,
     * or -1 if no valid token is present.
     */
    public static long getAccountIdFromToken(Context ctx) {
        String authHeader = ctx.header(Header.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return -1;
        String tokenStr = authHeader.substring(7).trim();
        if (tokenStr.isBlank()) return -1;

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            LoginToken lt = session.createQuery(
                    "FROM LoginToken WHERE token = :t AND type = 'ACCOUNT_SESSION'", LoginToken.class)
                    .setParameter("t", tokenStr).uniqueResult();
            if (lt == null || Instant.now().isAfter(lt.getSessionExpiresAt())) return -1;
            return lt.getAccountId();
        } catch (Exception e) {
            return -1;
        }
    }
    /**
     * Verifies that the request is being made by the account owner with the appropriate role,
     * then handles the request if both conditions are satisfied.
     *
     * <p>This method enforces account ownership by comparing the provided {@code accountId}
     * with the account ID extracted from the Bearer token. It also ensures the user possesses
     * the required {@link Role}. If both conditions are met, the handler is executed;
     * otherwise, a {@code 403 Forbidden} response is thrown.</p>
     *
     * @param handler the request handler to execute if verification succeeds
     * @param role the required {@link Role} the user must possess
     * @param ctx the Javalin request context
     * @param accountId the account ID to verify against the Bearer token owner
     * @throws ForbiddenResponse if the account ID does not match the token owner's ID, or if the user lacks the required role
     * @throws Exception if the handler execution throws an exception
     **/
    public static void verifiedAccountAPIHandler(@NotNull Handler handler, Role role, Context ctx, long accountId) throws Exception {
        if (accountId == getAccountIdFromToken(ctx) && userRoles(ctx).contains(role)) handler.handle(ctx);
        else throw new ForbiddenResponse("You can only access your own account data.");
    }

    /**
     * Retrieves a database object by ID, verifies it belongs to the authenticated account,
     * then handles the request with the associated account's verification.
     *
     * <p>This method performs the following steps:
     * <ol>
     *     <li>Extracts an object ID from the request path parameter</li>
     *     <li>Retrieves the object from the database using the {@link APIController}</li>
     *     <li>Returns a {@code 404 Not Found} response if the object does not exist</li>
     *     <li>Extracts the associated {@link Account} from the object via reflection</li>
     *     <li>Delegates to {@link #verifiedAccountAPIHandler(Handler, Role, Context, long)} to verify ownership and role before executing the handler</li>
     * </ol>
     * </p>
     *
     * <p><strong>Note:</strong> This method uses reflection to invoke the {@code getAccount()}
     * method on the retrieved object. The object class must have a {@code getAccount()} method
     * that returns an {@link Account} instance.</p>
     *
     * @param handler the request handler to execute if verification succeeds
     * @param role the required {@link Role} the user must possess
     * @param ctx the Javalin request context
     * @param api the {@link APIController} containing the class type and ID class for database operations
     * @throws ForbiddenResponse if the object's account does not match the token owner's ID, or if the user lacks the required role (propagated from {@code verifiedAccountAPIHandler})
     * @throws com.stripe.exception.ApiException with status {@code 404} if the object is not found in the database
     * @throws Exception if reflection invocation fails or the handler throws an exception
     *
     * @see APIController
     * @see DatabaseController#getOne(Class, Object)
     **/
    public static void verifiedAccountObjAPIHandler(@NotNull Handler handler, Role role, Context ctx, APIController api) throws Exception {
        Object objId = ctx.pathParamAsClass("id", api.idClazz).get();
        Object obj = DatabaseController.getOne(api.clazz, objId);
        if (obj == null) ApiErrors.notFound(ctx);

        Account acc = (Account) api.clazz.getMethod("getAccount").invoke(api.clazz.cast(obj));
        verifiedAccountAPIHandler(handler, role, ctx, acc.getAcctId());
    }

    /**
     * Maps an {@link AccountRole} to the set of Javalin {@link Role} route permissions it grants.
     *
     * @param accountRole the role assigned to an {@link Account}
     * @return a non-null, non-empty list of permitted {@link Role}s
     */
    static List<Role> rolesForAccountRole(AccountRole accountRole) {
        return switch (accountRole) {
            case CUSTOMER -> List.of(Role.READ);
            case STAFF    -> List.of(Role.READ, Role.WRITE);
            case ADMIN    -> List.of(Role.READ, Role.WRITE, Role.ADMIN);
        };
    }

    // ---- TEMP ----
    // Authentication test samples — to be replaced with API keys and/or user logins later.

    /**
     * Simple username/password pair used as the key in {@link #userRolesMap}.
     *
     * <p>Intentionally minimal; equality and hashing are based on both fields.</p>
     */
    static class Pair {
        String a, b;

        Pair(String a, String b) {
            this.a = a;
            this.b = b;
        }
        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Pair)) return false;
            Pair p = (Pair) o;
            return a.equals(p.a) && b.equals(p.b);
        }
        @Override
        public int hashCode() {
            return 31 * a.hashCode() + b.hashCode();
        }
    }

    private static final Map<Pair, List<Role>> userRolesMap = Map.of(
            new Pair("ali", "intentionallyInsecurePassword#1"), List.of(Role.READ),
            new Pair("bob", "intentionallyInsecurePassword#2"), List.of(Role.READ, Role.WRITE),
            new Pair("jim", "intentionallyInsecurePassword#3"), List.of(Role.READ, Role.WRITE, Role.ADMIN)
    );
}
