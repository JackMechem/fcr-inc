"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ReservationsPanel from "./components/ReservationsPanel";
import EditReservationPanel from "./components/EditReservationPanel";
import UserDetailsPanel from "./components/UserDetailsPanel";
import { useUserDashboardStore, DashboardReservation } from "@/stores/userDashboardStore";
import { useCartStore } from "@/stores/cartStore";
import { BiCheckCircle, BiCheck, BiX } from "react-icons/bi";
import styles from "./dashboard.module.css";

// ── Loading screen (same pattern as AdminShell) ────────────────────────────────

type FetchStatus = "pending" | "loading" | "done" | "error";

interface FetchItem {
    key: string;
    label: string;
    status: FetchStatus;
    count?: number;
}

const Spinner = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round"
        style={{ animation: "dashSpin 0.8s linear infinite", flexShrink: 0 }}
    >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        <style>{`@keyframes dashSpin { to { transform: rotate(360deg); } }`}</style>
    </svg>
);

const LoadingScreen = ({ items }: { items: FetchItem[] }) => (
    <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        gap: 32,
    }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}>
            <p style={{ fontSize: "18pt", fontWeight: 700, color: "var(--color-foreground)", marginBottom: 8 }}>
                Loading Dashboard
            </p>
            {items.map((item) => (
                <div key={item.key} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: "11pt" }}>
                    <span style={{
                        width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center",
                        borderRadius: "50%", flexShrink: 0,
                        backgroundColor: item.status === "done"
                            ? "rgba(34,197,94,0.12)"
                            : item.status === "error"
                                ? "rgba(239,68,68,0.12)"
                                : "transparent",
                        color: item.status === "done"
                            ? "#22c55e"
                            : item.status === "error"
                                ? "#ef4444"
                                : "var(--color-foreground-light)",
                    }}>
                        {item.status === "done" ? <BiCheck size={16} /> :
                         item.status === "error" ? <BiX size={16} /> :
                         item.status === "loading" ? <Spinner /> :
                         <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--color-third)", display: "inline-block" }} />}
                    </span>
                    <span style={{
                        color: item.status === "done"
                            ? "var(--color-foreground)"
                            : item.status === "error"
                                ? "#ef4444"
                                : "var(--color-foreground-light)",
                    }}>
                        {item.label}
                        {item.status === "done" && item.count !== undefined && (
                            <span style={{ color: "var(--color-foreground-light)", marginLeft: 6, fontSize: "9.5pt" }}>
                                ({item.count})
                            </span>
                        )}
                        {item.status === "error" && (
                            <span style={{ marginLeft: 6, fontSize: "9.5pt" }}>— failed</span>
                        )}
                    </span>
                </div>
            ))}
        </div>
    </div>
);

// ── Shell ──────────────────────────────────────────────────────────────────────

interface Props {
    paymentSuccess: boolean;
}

export default function DashboardShell({ paymentSuccess: initialPaymentSuccess }: Props) {
    const { activeView, accountId, isAuthenticated } = useUserDashboardStore();
    const { clearCart } = useCartStore();
    const router = useRouter();

    const [paymentSuccess, setPaymentSuccess] = useState(initialPaymentSuccess);
    const [reservations, setReservations] = useState<DashboardReservation[]>([]);
    const [userData, setUserData] = useState<Record<string, unknown> | null>(null);

    const [fetchItems, setFetchItems] = useState<FetchItem[]>([
        { key: "account", label: "Fetching account & reservations", status: "pending" },
        { key: "cars",    label: "Loading vehicle details",         status: "pending" },
    ]);

    const setStatus = (key: string, status: FetchStatus, count?: number) =>
        setFetchItems((prev) => prev.map((item) => item.key === key ? { ...item, status, count } : item));

    const allSettled = fetchItems.every((i) => i.status === "done" || i.status === "error");

    useEffect(() => {
        if (!isAuthenticated) {
            router.replace("/login?next=/dashboard");
            return;
        }
        if (!accountId) return;

        setStatus("account", "loading");

        fetch(`/api/accounts/${accountId}?parseFullObjects=true`)
            .then((r) => {
                if (!r.ok) throw new Error(`${r.status}`);
                return r.json();
            })
            .then(async (account: Record<string, unknown>) => {
                const user = (account.user as Record<string, unknown>) ?? null;
                setUserData(user);

                const raw = (user?.reservations ?? []) as Record<string, unknown>[];
                setStatus("account", "done", raw.length);

                if (!raw.length) {
                    setReservations([]);
                    setStatus("cars", "done", 0);
                    return;
                }

                // Hydrate car VINs in parallel
                setStatus("cars", "loading");
                const vins = [...new Set(raw.map((r) => r.car as string).filter(Boolean))];
                const carResults = await Promise.all(
                    vins.map((vin) =>
                        fetch(`/api/cars/${vin}`)
                            .then((r) => (r.ok ? r.json() : null))
                            .catch(() => null),
                    ),
                );
                const carMap = new Map<string, Record<string, unknown>>();
                carResults.forEach((car) => { if (car) carMap.set(car.vin as string, car); });

                const hydrated: DashboardReservation[] = raw.map((r) => {
                    const vin = r.car as string;
                    const car = carMap.get(vin) ?? null;
                    return {
                        ...r,
                        car: car
                            ? { vin: car.vin as string, make: car.make as string, model: car.model as string, images: (car.images as string[]) ?? [] }
                            : null,
                        paymentIds: (r.payments as string[]) ?? [],
                    } as DashboardReservation;
                });

                setReservations(hydrated);
                setStatus("cars", "done", vins.length);
            })
            .catch(() => {
                setStatus("account", "error");
                setStatus("cars", "error");
            });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accountId]);

    useEffect(() => {
        if (initialPaymentSuccess) {
            clearCart();
            router.replace("/dashboard", { scroll: false });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!allSettled) return <LoadingScreen items={fetchItems} />;

    const renderPanel = () => {
        switch (activeView) {
            case "edit-reservation": return <EditReservationPanel />;
            case "user-details":     return <UserDetailsPanel initialUser={userData} />;
            default:                 return <ReservationsPanel reservations={reservations} />;
        }
    };

    return (
        <>
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
        </>
    );
}
