package com.inc.fcr.auth;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * JPA entity representing an authentication token stored in {@code auth_login_tokens}.
 *
 * <p>Two token types, distinguished by {@link #type}:</p>
 * <ul>
 *   <li>{@code "ACCOUNT_CONFIRM"} — short-lived link emailed on registration or re-login.
 *       Clicking it sets {@link Account#getEmailConfirmedAt()} and issues a session token.</li>
 *   <li>{@code "ACCOUNT_SESSION"} — long-lived Bearer credential returned after confirmation.
 *       Passed as {@code Authorization: Bearer <token>} on subsequent API requests.</li>
 * </ul>
 */
@Entity
@Table(name = "auth_login_tokens")
public class LoginToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    /** UUID string sent in the email or used as the Bearer credential. */
    @Column(nullable = false, unique = true, length = 36)
    private String token;

    /** Token purpose: {@code "ACCOUNT_CONFIRM"} or {@code "ACCOUNT_SESSION"}. */
    @Column(nullable = false)
    private String type;

    /** The {@link Account#getId()} this token belongs to. */
    @Column(nullable = false)
    private long accountId;

    /** Email address the link or session belongs to. */
    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private Instant createdAt;

    /** When the confirmation link expires (not used for session tokens). */
    @Column(nullable = false)
    private Instant expiresAt;

    /** Set when the confirmation link is clicked; {@code null} for session tokens. */
    @Column
    private Instant verifiedAt;

    /** When this Bearer session expires. */
    @Column(nullable = false)
    private Instant sessionExpiresAt;

    /** Required by JPA/Hibernate. */
    public LoginToken() {}

    public long getId() { return id; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public long getAccountId() { return accountId; }
    public void setAccountId(long accountId) { this.accountId = accountId; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }

    public Instant getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(Instant verifiedAt) { this.verifiedAt = verifiedAt; }

    public Instant getSessionExpiresAt() { return sessionExpiresAt; }
    public void setSessionExpiresAt(Instant sessionExpiresAt) { this.sessionExpiresAt = sessionExpiresAt; }
}
