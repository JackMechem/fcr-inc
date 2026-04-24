"use client";

import { useState } from "react";
import styles from "../../dashboard.module.css";
import { sendMagicLink } from "../../actions";

export default function MagicLinkPromptPage() {
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await sendMagicLink(email);
            sessionStorage.setItem("pending-auth-email", email);
            setSent(true);
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.promptWrapper}>
            <div className={styles.promptCard}>
                {!sent ? (
                    <>
                        <p className={styles.promptTitle}>Sign In</p>
                        <p className={styles.promptSubtitle}>Enter the email address used at checkout. We&apos;ll send you a secure login link.</p>
                        <form onSubmit={handleSubmit} className={styles.promptForm}>
                            <div className={styles.promptFieldGroup}>
                                <label className={styles.promptLabel}>Email</label>
                                <input
                                    type="email"
                                    className={styles.promptInput}
                                    placeholder="john@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            <button type="submit" className={styles.promptBtn} disabled={loading}>
                                {loading ? "Sending..." : "Send Login Link"}
                            </button>
                        </form>
                        {error && <p className={styles.promptError}>{error}</p>}
                    </>
                ) : (
                    <>
                        <p className={styles.promptTitle}>Check Your Email</p>
                        <p className={styles.promptSubtitle}>
                            We sent a login link to <strong>{email}</strong>. Click the link in the email to access your dashboard.
                        </p>
                        <p className={styles.promptSubtitle} style={{ marginTop: 8 }}>
                            The link will expire in 24 hours. You can close this tab.
                        </p>
                        <button
                            className={styles.promptBtn}
                            style={{ marginTop: 4 }}
                            onClick={() => { setSent(false); setEmail(""); }}
                        >
                            Use a different email
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
