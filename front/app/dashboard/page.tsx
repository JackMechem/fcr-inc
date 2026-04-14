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

// ── Email lookup prompt ───────────────────────────────────────────────────────

function EmailPrompt() {
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
            const id = user?.id ?? user?.userId ?? null;
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
                <p className={styles.promptTitle}>My Reservations</p>
                <p className={styles.promptSubtitle}>Enter the email used at checkout to view your reservations</p>
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

// ── Page ──────────────────────────────────────────────────────────────────────

function DashboardInner() {
    const { collapsed, activeView, userId } = useUserDashboardStore();
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

    if (!userId) return (
        <>
            <NavHeader white={false} />
            <EmailPrompt />
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
