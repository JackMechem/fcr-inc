"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Cookies from "js-cookie";
import { useUserDashboardStore } from "@/stores/userDashboardStore";
import NavHeader from "@/app/components/headers/navHeader";
import styles from "@/app/login/login.module.css";

export default function ConfirmPage() {
    const { token } = useParams<{ token: string }>();
    const router = useRouter();
    const { setSession, setUserEmail } = useUserDashboardStore();
    const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            return;
        }

        fetch(`/api/auth/confirm/${token}`)
            .then(async (res) => {
                if (!res.ok) throw new Error("invalid");
                return res.json();
            })
            .then((data: { token?: string; acctId?: number; userId?: number | null; role?: string; sessionExpiresAt?: string; message?: string }) => {
                if (data.token && data.acctId != null && data.role && data.sessionExpiresAt) {
                    setSession(data.token, data.acctId, data.role, data.sessionExpiresAt, data.userId);
                    const isPrivileged = data.role === "ADMIN" || data.role === "STAFF";
                    const exp = isPrivileged ? 365 : new Date(data.sessionExpiresAt);
                    Cookies.set("user-session", data.token, { path: "/", expires: exp });
                    Cookies.set("account-id", String(data.acctId), { path: "/", expires: exp });
                    Cookies.set("user-role", data.role, { path: "/", expires: exp });
                    if (data.userId != null) {
                        Cookies.set("stripe-user-id", String(data.userId), { path: "/", expires: exp });
                    }
                    const pendingEmail = sessionStorage.getItem("pending-auth-email");
                    if (pendingEmail) { setUserEmail(pendingEmail); sessionStorage.removeItem("pending-auth-email"); }
                    const addingAccount = sessionStorage.getItem("add-account") === "1";
                    if (addingAccount) sessionStorage.removeItem("add-account");
                    setStatus("success");
                    const redirect = addingAccount && isPrivileged ? "/admin" : "/dashboard";
                    setTimeout(() => router.replace(redirect), 1200);
                } else {
                    setStatus("error");
                }
            })
            .catch(() => setStatus("error"));
    }, [token]);

    return (
        <div>
            <NavHeader white={false} />
            <div className={styles.pageWrapper}>
                <div className={styles.card}>
                    {status === "verifying" && (
                        <>
                            <h1 className={`page-title ${styles.title}`}>Verifying&hellip;</h1>
                            <p className={`page-subtitle ${styles.subtitle}`}>Please wait while we verify your link.</p>
                        </>
                    )}
                    {status === "success" && (
                        <>
                            <h1 className={`page-title ${styles.title}`}>Verified!</h1>
                            <p className={`page-subtitle ${styles.subtitle}`}>Redirecting you to your dashboard&hellip;</p>
                        </>
                    )}
                    {status === "error" && (
                        <>
                            <h1 className={`page-title ${styles.title}`}>Link Invalid</h1>
                            <p className={`page-subtitle ${styles.subtitle}`}>This link has expired or already been used.</p>
                            <button className={styles.submitBtn} onClick={() => router.push("/login")}>
                                Go to Login
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
