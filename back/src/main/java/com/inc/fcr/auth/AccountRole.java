package com.inc.fcr.auth;

/**
 * Role assigned to an {@link Account}, controlling API access level.
 *
 * <p>Maps to Javalin {@link com.inc.fcr.Role} permissions as follows:</p>
 * <ul>
 *   <li>{@link #CUSTOMER} — {@code Role.READ}</li>
 *   <li>{@link #STAFF}    — {@code Role.READ}, {@code Role.WRITE}</li>
 *   <li>{@link #ADMIN}    — {@code Role.READ}, {@code Role.WRITE}, {@code Role.ADMIN}</li>
 * </ul>
 */
public enum AccountRole {
    /** Standard customer account; read-only access. */
    CUSTOMER,
    /** Internal staff; read and write access. */
    STAFF,
    /** Full administrative access. */
    ADMIN
}
