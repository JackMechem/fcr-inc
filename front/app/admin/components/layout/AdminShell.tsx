"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import NavHeader from "../../../components/headers/navHeader";
import AdminSidebar from "../../../components/menus/adminSidebar";
import MobileMenuButton from "../../../components/buttons/MobileMenuButton";
import CarFormPanel from "../panels/CarFormPanel";
import DashboardPanel from "../panels/DashboardPanel";
import InventoryPanel from "../panels/InventoryPanel";
import ReservationsPanel from "../panels/ReservationsPanel";
import UsersPanel from "../panels/UsersPanel";
import UserProfilesPanel from "../panels/UserProfilesPanel";
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
            <NavHeader white={false} mobileMenuTrigger={<MobileMenuButton />} />
            <AdminSidebar />
            <div
                className="transition-all duration-300 ease-in-out"
                style={{
                    position: "fixed",
                    top: 65,
                    left: 0,
                    right: 0,
                    bottom: 0,
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
                    gap: 8,
                }}>
                    {role === "ADMIN" && (
                        <div style={{
                            flexShrink: 0,
                            padding: "11px 16px",
                            background: "rgba(239, 68, 68, 0.1)",
                            border: "1.5px solid rgba(239, 68, 68, 0.65)",
                            borderRadius: 10,
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 10,
                        }}>
                            <span style={{ fontSize: 16, lineHeight: 1.4, flexShrink: 0 }}>⚠️</span>
                            <div>
                                <p style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: "#ef4444", marginBottom: 2 }}>
                                    WARNING — ADMINISTRATOR ACCESS
                                </p>
                                <p style={{ fontSize: "11.5px", color: "#ef4444", lineHeight: 1.55, opacity: 0.9 }}>
                                    You have <strong>full, unrestricted access</strong> to the live database. Any changes are <strong>permanent and immediate</strong>. Do <strong>NOT</strong> modify or delete data unless you are absolutely certain of what you are doing.
                                </p>
                            </div>
                        </div>
                    )}
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
