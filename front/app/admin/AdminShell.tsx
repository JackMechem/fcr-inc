"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NavHeader from "../components/headers/navHeader";
import AdminSidebar from "../components/menus/adminSidebar";
import CarFormPanel from "./components/CarFormPanel";
import DashboardPanel from "./components/DashboardPanel";
import InventoryPanel from "./components/InventoryPanel";
import ReservationsPanel from "./components/ReservationsPanel";
import UsersPanel from "./components/UsersPanel";
import UserProfilesPanel from "./components/UserProfilesPanel";
import { useAdminSidebarStore } from "@/stores/adminSidebarStore";
import { useWindowSize } from "@/app/hooks/useWindowSize";
import { useUserDashboardStore } from "@/stores/userDashboardStore";
import { Car } from "@/app/types/CarTypes";
import { Reservation } from "@/app/types/ReservationTypes";
import { Account, User, getAllAccounts, getAllUsers, getAllCars } from "@/app/lib/AdminApiCalls";
import { getAllReservations } from "@/app/lib/ReservationApi";
import { BiCheck, BiX } from "react-icons/bi";

// ── Loading screen ─────────────────────────────────────────────────────────────

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
        style={{ animation: "adminSpin 0.8s linear infinite", flexShrink: 0 }}
    >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        <style>{`@keyframes adminSpin { to { transform: rotate(360deg); } }`}</style>
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

export default function AdminShell() {
    const { collapsed, activeView } = useAdminSidebarStore();
    const { width } = useWindowSize();
    const isMobile = width !== undefined && width < 768;
    const router = useRouter();
    const { isAuthenticated, sessionToken, role } = useUserDashboardStore();

    const [cars, setCars] = useState<Car[]>([]);
    const [rawReservations, setRawReservations] = useState<Reservation[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [users, setUsers] = useState<User[]>([]);

    // Hydrate reservations: join car VIN strings with full Car objects
    const reservations: Reservation[] = rawReservations.map((r) => {
        if (typeof r.car !== "string") return r;
        const found = cars.find((c) => c.vin === r.car);
        return found ? { ...r, car: found } : r;
    });

    const [fetchItems, setFetchItems] = useState<FetchItem[]>([
        { key: "cars",         label: "Fetching fleet inventory",  status: "pending" },
        { key: "reservations", label: "Fetching all reservations", status: "pending" },
        { key: "accounts",     label: "Fetching accounts",         status: "pending" },
        { key: "users",        label: "Fetching user profiles",    status: "pending" },
    ]);

    const setStatus = (key: string, status: FetchStatus, count?: number) =>
        setFetchItems((prev) =>
            prev.map((item) => item.key === key ? { ...item, status, count } : item)
        );

    const allSettled = fetchItems.every((i) => i.status === "done" || i.status === "error");

    useEffect(() => {
        if (!isAuthenticated || !sessionToken || (role !== "ADMIN" && role !== "STAFF")) {
            router.replace("/login?next=/admin");
        }
    }, [isAuthenticated, sessionToken, role]);

    useEffect(() => {
        // Cars
        setStatus("cars", "loading");
        getAllCars({ pageSize: 500 })
            .then((res) => { setCars(res.data); setStatus("cars", "done", res.data.length); })
            .catch(() => setStatus("cars", "error"));

        // Reservations
        setStatus("reservations", "loading");
        getAllReservations({ pageSize: 200 })
            .then((res) => { setRawReservations(res.data); setStatus("reservations", "done", res.data.length); })
            .catch(() => setStatus("reservations", "error"));

        // Accounts
        setStatus("accounts", "loading");
        getAllAccounts({ pageSize: 200 })
            .then((res) => { setAccounts(res.data); setStatus("accounts", "done", res.data.length); })
            .catch(() => setStatus("accounts", "error"));

        // Users
        setStatus("users", "loading");
        getAllUsers({ pageSize: 500 })
            .then((res) => { setUsers(res.data); setStatus("users", "done", res.data.length); })
            .catch(() => setStatus("users", "error"));
    }, []);

    const refreshCars = async () => {
        setStatus("cars", "loading");
        try {
            const res = await getAllCars({ pageSize: 500 });
            setCars(res.data);
            setStatus("cars", "done", res.data.length);
        } catch { setStatus("cars", "error"); }
    };

    const refreshReservations = async () => {
        setStatus("reservations", "loading");
        try {
            const res = await getAllReservations({ pageSize: 200 });
            setRawReservations(res.data);
            setStatus("reservations", "done", res.data.length);
        } catch { setStatus("reservations", "error"); }
    };

    const refreshAccounts = async () => {
        setStatus("accounts", "loading");
        try {
            const res = await getAllAccounts({ pageSize: 200 });
            setAccounts(res.data);
            setStatus("accounts", "done", res.data.length);
        } catch { setStatus("accounts", "error"); }
    };

    const refreshUsers = async () => {
        setStatus("users", "loading");
        try {
            const res = await getAllUsers({ pageSize: 500 });
            setUsers(res.data);
            setStatus("users", "done", res.data.length);
        } catch { setStatus("users", "error"); }
    };

    const renderContent = () => {
        if (!allSettled) return <LoadingScreen items={fetchItems} />;

        switch (activeView) {
            case "add-car":
                return (
                    <div>
                        <h1 className="page-title" style={{ marginBottom: 24 }}>Add Car</h1>
                        <CarFormPanel mode="add" />
                    </div>
                );
            case "edit-car":
                return (
                    <div>
                        <h1 className="page-title" style={{ marginBottom: 24 }}>Edit Car</h1>
                        <CarFormPanel mode="edit" />
                    </div>
                );
            case "view-data":
                return <InventoryPanel cars={cars} onRefresh={refreshCars} />;
            case "view-reservations":
                return <ReservationsPanel reservations={reservations} accounts={accounts} onRefresh={refreshReservations} />;
            case "view-accounts":
                return <UsersPanel accounts={accounts} onRefresh={refreshAccounts} />;
            case "view-users":
                return <UserProfilesPanel users={users} onRefresh={refreshUsers} />;
            default:
                return <DashboardPanel cars={cars} />;
        }
    };

    return (
        <>
            <NavHeader white={false} />
            <AdminSidebar />
            <div
                className="transition-all duration-300 ease-in-out"
                style={{
                    paddingLeft: isMobile ? 0 : collapsed ? 64 : 220,
                    paddingBottom: isMobile ? 80 : 0,
                    backgroundColor: "var(--color-primary)",
                    minHeight: "calc(100vh - 65px)",
                }}
            >
                <div style={{ padding: isMobile ? "8px" : "10px" }}>
                    <div style={{
                        backgroundColor: "var(--color-primary)",
                        borderRadius: "16px",
                        border: "1px solid var(--color-third)",
                        boxShadow: "0 2px 16px rgba(0, 0, 0, 0.06)",
                        minHeight: "calc(100vh - 65px - 20px)",
                        padding: isMobile ? "24px 16px 60px" : "36px 40px 60px",
                    }}>
                        {renderContent()}
                    </div>
                </div>
            </div>
        </>
    );
}
