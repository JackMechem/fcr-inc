package com.inc.fcr;

import io.javalin.http.Context;
import io.javalin.http.UnauthorizedResponse;

/**
 * API key gate for the FCR API.
 *
 * <p>When the {@code API_KEY} environment variable is set, every inbound request must
 * include an {@code X-API-Key} header whose value matches. Requests missing or
 * presenting an incorrect key are rejected with {@code 401 Unauthorized}.</p>
 *
 * <p>If {@code API_KEY} is not set (or blank), API key checking is disabled entirely
 * and all requests pass through. This lets the API run open in local development
 * without any extra configuration.</p>
 *
 * <p>Usage: call {@link #check(Context)} as the first step in the
 * {@code beforeMatched} handler ({@link Auth#handleAccess}).</p>
 */
public class ApiKeyAuth {

    /** The required API key, or {@code null} if checking is disabled. */
    private static final String REQUIRED_KEY = resolveKey();

    private static String resolveKey() {
        String key = System.getenv("API_KEY");
        return (key != null && !key.isBlank()) ? key.trim() : null;
    }

    /**
     * Returns {@code true} if API key enforcement is active (i.e. {@code API_KEY} is set).
     */
    public static boolean isEnabled() {
        return REQUIRED_KEY != null;
    }

    /**
     * Checks the {@code X-API-Key} header on the request.
     *
     * <p>If {@code API_KEY} is not configured this method returns immediately.
     * Otherwise it compares the header value against the configured key and throws
     * {@link UnauthorizedResponse} if the key is absent or does not match.</p>
     *
     * @param ctx the Javalin request context
     * @throws UnauthorizedResponse if enforcement is active and the key is wrong or missing
     */
    public static void check(Context ctx) {
        if (REQUIRED_KEY == null) return;

        String provided = ctx.header("X-API-Key");
        if (provided == null || !REQUIRED_KEY.equals(provided.trim())) {
            throw new UnauthorizedResponse("Invalid or missing API key");
        }
    }
}
