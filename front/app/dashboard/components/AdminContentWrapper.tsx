"use client";

import { useUserDashboardStore, UserDashboardView } from "@/stores/userDashboardStore";
import CarFormPanel from "@/app/admin/components/CarFormPanel";
import AdminDashboardPanel from "@/app/admin/components/DashboardPanel";
import InventoryPanel from "@/app/admin/components/InventoryPanel";
import AdminReservationsPanel from "@/app/admin/components/ReservationsPanel";
import UsersPanel from "@/app/admin/components/UsersPanel";
import UserProfilesPanel from "@/app/admin/components/UserProfilesPanel";

// ── Helpers ──────────────────────────────────────────────────────────────────

const ADMIN_VIEWS = new Set<UserDashboardView>([
    "admin-dashboard", "add-car", "edit-car", "view-data",
    "view-reservations", "view-accounts", "view-users",
]);

export function isAdminView(view: UserDashboardView): boolean {
    return ADMIN_VIEWS.has(view);
}

// ── Wrapper ──────────────────────────────────────────────────────────────────

export default function AdminContentWrapper() {
    const { activeView, role } = useUserDashboardStore();

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
            return <AdminReservationsPanel />;
        case "view-accounts":
            return <UsersPanel />;
        case "view-users":
            return <UserProfilesPanel />;
        case "admin-dashboard":
        default:
            return <AdminDashboardPanel />;
    }
}
