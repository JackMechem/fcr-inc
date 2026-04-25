"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import NavHeader from "../components/headers/navHeader";
import styles from "./login.module.css";
import { useUserDashboardStore } from "@/stores/userDashboardStore";

function LoginInner() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { isAuthenticated } = useUserDashboardStore();
    const [addingAccount, setAddingAccount] = useState(false);

    useEffect(() => {
        setAddingAccount(sessionStorage.getItem("add-account") === "1");
    }, []);

    const nextParam = searchParams.get("next");

    useEffect(() => {
        if (!isAuthenticated) return;
        // If the user is adding a second account, don't redirect — let them log in.
        if (sessionStorage.getItem("add-account") === "1") return;
        if (nextParam && nextParam !== "/login") {
            router.replace(nextParam);
            return;
        }
        const saved = sessionStorage.getItem("pre-login-path");
        sessionStorage.removeItem("pre-login-path");
        if (saved && saved !== "/login") {
            router.replace(saved);
        } else {
            router.replace("/dashboard");
        }
    }, [isAuthenticated, router, nextParam]);
    const reason = searchParams.get("reason");
    const prefillEmail = searchParams.get("email") ?? "";

    const [email, setEmail] = useState(prefillEmail);
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
                signal: AbortSignal.timeout(8000),
            });
            if (res.status === 400) {
                setError("Please enter a valid email address.");
                return;
            }
            // Always show success (backend prevents email enumeration)
            sessionStorage.setItem("pending-auth-email", email);
            setSent(true);
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <div className={styles.card}>
                <h1 className={`page-title ${styles.title}`}>Check Your Email</h1>
                <p className={`page-subtitle ${styles.subtitle}`}>
                    We sent a login link to <strong>{email}</strong>. Click the link to sign in.
                </p>
                <p className={`page-subtitle ${styles.subtitle}`}>The link expires in 24 hours.</p>
                <button className={styles.secondaryBtn} onClick={() => { setSent(false); setEmail(""); }}>
                    Use a different email
                </button>
            </div>
        );
    }

    return (
        <div className={styles.card}>
            <h1 className={`page-title ${styles.title}`}>{addingAccount ? "Add Account" : "Sign In"}</h1>

            {addingAccount && (
                <p className={styles.reasonNote} style={{ borderColor: "rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.06)", color: "#3b82f6" }}>
                    Sign in with another account to add it to your session switcher.
                </p>
            )}

            {reason === "inactivity" && (
                <p className={styles.reasonNote} style={{ borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.06)", color: "#ef4444" }}>
                    You were signed out due to 5 minutes of inactivity.
                </p>
            )}

            {reason === "account_exists" && (
                <p className={styles.reasonNote}>
                    A full account exists for this email. Sign in below to continue your checkout.
                </p>
            )}

            <p className={`page-subtitle ${styles.subtitle}`}>Enter your email and we&apos;ll send you a secure login link.</p>
            <form onSubmit={handleSubmit} className={styles.fields}>
                <div className={styles.fieldGroup}>
                    <label className={styles.label}>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={styles.input}
                        placeholder="john@example.com"
                        required
                        autoFocus={!prefillEmail}
                    />
                </div>
                {error && <p className={styles.errorText}>{error}</p>}
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                    {loading ? "Sending..." : "Send Login Link"}
                </button>
                <Link
                    href={`/register${email ? `?email=${encodeURIComponent(email)}` : ""}`}
                    className={styles.secondaryBtn}
                >
                    Create Account
                </Link>
            </form>
        </div>
    );
}

const LoginPage = () => (
    <div>
        <NavHeader white={false} />
        <div className={styles.pageWrapper}>
            <Suspense>
                <LoginInner />
            </Suspense>
        </div>
    </div>
);

export default LoginPage;
