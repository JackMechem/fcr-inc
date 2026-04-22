"use client";

import { useEffect } from "react";
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

// ── Shell ──────────────────────────────────────────────────────────────────────

export default function AdminShell() {
    const { collapsed, activeView } = useAdminSidebarStore();
    const { width } = useWindowSize();
    const isMobile = width !== undefined && width < 768;
    const router = useRouter();
    const { isAuthenticated, sessionToken, role } = useUserDashboardStore();

    useEffect(() => {
        if (!isAuthenticated || !sessionToken || (role !== "ADMIN" && role !== "STAFF")) {
            router.replace("/login?next=/admin");
        }
    }, [isAuthenticated, sessionToken, role, router]);

    const isTableView = activeView === "view-data" || activeView === "view-reservations" || activeView === "view-accounts" || activeView === "view-users";

    const renderContent = () => {
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
                return <InventoryPanel role={role ?? ""} />;
            case "view-reservations":
                return <ReservationsPanel />;
            case "view-accounts":
                return <UsersPanel />;
            case "view-users":
                return <UserProfilesPanel />;
            default:
                return <DashboardPanel />;
        }
    };

    return (
        <>
            <NavHeader white={false} />
            <AdminSidebar />
            <div
                className="transition-all duration-300 ease-in-out"
                style={{
                    position: "fixed",
                    top: 65,
                    left: 0,
                    right: 0,
                    bottom: isMobile ? 80 : 0,
                    paddingLeft: isMobile ? 0 : collapsed ? 54 : 220,
                    backgroundColor: "var(--color-primary)",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column" as const,
                    zIndex: 1,
                }}
            >
                <div style={{
                    flex: 1,
                    minHeight: 0,
                    padding: isMobile ? "8px" : "10px",
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column" as const,
                }}>
                    <div style={{
                        backgroundColor: "var(--color-primary)",
                        borderRadius: "16px",
                        border: "1px solid var(--color-third)",
                        boxShadow: isTableView ? "none" : "0 2px 16px rgba(0, 0, 0, 0.06)",
                        flex: 1,
                        minHeight: 0,
                        padding: isTableView ? 0 : isMobile ? "24px 16px 24px" : "36px 40px 36px",
                        display: "flex",
                        flexDirection: "column" as const,
                        overflow: isTableView ? "hidden" : "auto",
                        boxSizing: "border-box",
                    }}>
                        {!isTableView && (
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                marginBottom: 20,
                                fontSize: "9pt",
                                fontWeight: 600,
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                color: role === "ADMIN" ? "#ef4444" : "#3b82f6",
                                flexShrink: 0,
                            }}>
                                <span style={{
                                    width: 7,
                                    height: 7,
                                    borderRadius: "50%",
                                    backgroundColor: role === "ADMIN" ? "#ef4444" : "#3b82f6",
                                    display: "inline-block",
                                }} />
                                {role === "ADMIN" ? "Admin" : "Staff"}
                            </div>
                        )}
                        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" as const }}>
                            {renderContent()}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
