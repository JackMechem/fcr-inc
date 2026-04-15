"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import NavHeader from "../components/headers/navHeader";
import MainBodyContainer from "../components/containers/mainBodyContainer";
import UserSidebar from "./components/UserSidebar";
import ReservationsPanel from "./components/ReservationsPanel";
import EditReservationPanel from "./components/EditReservationPanel";
import UserDetailsPanel from "./components/UserDetailsPanel";
import { useUserDashboardStore } from "@/stores/userDashboardStore";
import { useCartStore } from "@/stores/cartStore";
import { useWindowSize } from "../hooks/useWindowSize";
import { BiCheckCircle, BiX } from "react-icons/bi";
import styles from "./dashboard.module.css";

// ── Guest email lookup prompt ─────────────────────────────────────────────────

function GuestEmailPrompt() {
    const { setUserId, setUserEmail } = useUserDashboardStore();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/user-lookup?email=${encodeURIComponent(email)}`);
            const data = await res.json();
            const user = data?.data?.[0] ?? data ?? null;
            const id = user?.userId ?? user?.id ?? null;
            if (!id) throw new Error("No reservations found for that email.");
            setUserEmail(email);
            setUserId(id);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.promptWrapper}>
            <div className={styles.promptCard}>
                <p className={styles.promptTitle}>Guest Dashboard</p>
                <p className={styles.promptSubtitle}>Enter the email address used at checkout to view and manage your reservations.</p>
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
                        {loading ? "Looking up..." : "Continue"}
                    </button>
                </form>
                {error && <p className={styles.promptError}>{error}</p>}
            </div>
        </div>
    );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
// Supports both guest mode (email lookup) and authenticated mode (future accounts).
// To add authenticated users: set `isAuthenticated = true` and `userId` in the
// store from your auth session, and the email prompt will be bypassed automatically.

function DashboardInner() {
    const { collapsed, activeView, userId, isAuthenticated } = useUserDashboardStore();
    const { clearCart } = useCartStore();
    const { width } = useWindowSize();
    const searchParams = useSearchParams();
    const router = useRouter();
    const isMobile = width !== undefined && width < 768;

    const [paymentSuccess, setPaymentSuccess] = useState(false);

    useEffect(() => {
        if (searchParams.get("payment") === "success") {
            clearCart();
            setPaymentSuccess(true);
            router.replace("/dashboard", { scroll: false });
        }
    }, [searchParams]);

    const renderPanel = () => {
        switch (activeView) {
            case "edit-reservation": return <EditReservationPanel />;
            case "user-details":    return <UserDetailsPanel />;
            default:                return <ReservationsPanel />;
        }
    };

    // ── Guest gate ────────────────────────────────────────────────────────────
    // Authenticated users will bypass this automatically once isAuthenticated
    // and userId are populated from a real auth session.
    if (!isAuthenticated && !userId) return (
        <>
            <NavHeader white={false} />
            <GuestEmailPrompt />
        </>
    );

    return (
        <>
            <NavHeader white={false} />
            <UserSidebar />
            <div
                className={styles.content}
                style={{ paddingLeft: isMobile ? 0 : collapsed ? 64 : 220, paddingBottom: isMobile ? 80 : 0 }}
            >
                <MainBodyContainer>
                    <div className={styles.inner}>
                        {/* Guest mode notice — hidden for authenticated users */}
                        {!isAuthenticated && (
                            <div className={styles.guestBanner}>
                                <span className={styles.guestBannerLabel}>Guest Dashboard</span>
                                <span className={styles.guestBannerSub}>Viewing as guest &mdash; create an account for faster access.</span>
                            </div>
                        )}
                        {paymentSuccess && (
                            <div className={styles.successBanner}>
                                <div className={styles.successBannerLeft}>
                                    <BiCheckCircle className={styles.successBannerIcon} />
                                    <span>Payment successful! Your reservation has been confirmed.</span>
                                </div>
                                <button onClick={() => setPaymentSuccess(false)} className={styles.successBannerClose}>
                                    <BiX />
                                </button>
                            </div>
                        )}
                        {renderPanel()}
                    </div>
                </MainBodyContainer>
            </div>
        </>
    );
}

export default function DashboardPage() {
    return (
        <Suspense>
            <DashboardInner />
        </Suspense>
    );
}
