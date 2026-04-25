"use client";

import { useEffect } from "react";
import { useUserDashboardStore, UserDashboardView } from "@/stores/userDashboardStore";
import { useTableConfigStore } from "@/app/admin/config/tableConfigStore";
import CarFormPanel from "@/app/admin/components/panels/CarFormPanel";
import AdminDashboardPanel from "@/app/admin/components/panels/DashboardPanel";
import InventoryPanel from "@/app/admin/components/panels/InventoryPanel";
import AdminReservationsPanel from "@/app/admin/components/panels/ReservationsPanel";
import UsersPanel from "@/app/admin/components/panels/UsersPanel";
import UserProfilesPanel from "@/app/admin/components/panels/UserProfilesPanel";
import ReviewsPanel from "@/app/admin/components/panels/ReviewsPanel";
import BookmarksPanel from "@/app/admin/components/panels/BookmarksPanel";
import PermissionsPanel from "@/app/admin/components/panels/PermissionsPanel";
import CreateInvoicePanel from "@/app/admin/components/panels/CreateInvoicePanel";
import ViewPaymentsPanel from "@/app/admin/components/panels/ViewPaymentsPanel";
import CarsListPanel from "@/app/admin/components/panels/CarsListPanel";
import ReservationsListPanel from "@/app/admin/components/panels/ReservationsListPanel";
import AccountsListPanel from "@/app/admin/components/panels/AccountsListPanel";
import UsersListPanel from "@/app/admin/components/panels/UsersListPanel";
import ReviewsListPanel from "@/app/admin/components/panels/ReviewsListPanel";
import PaymentsListPanel from "@/app/admin/components/panels/PaymentsListPanel";

// ── Helpers ──────────────────────────────────────────────────────────────────

const ADMIN_VIEWS = new Set<UserDashboardView>([
    "admin-dashboard", "add-car", "edit-car",
    "view-data", "view-reservations", "view-accounts", "view-users", "view-reviews", "view-bookmarks",
    "list-data", "list-reservations", "list-accounts", "list-users", "list-reviews", "list-payments",
    "view-permissions-admin", "view-permissions-staff",
    "create-invoice", "view-payments",
]);

export function isAdminView(view: UserDashboardView): boolean {
    return ADMIN_VIEWS.has(view);
}

// ── Wrapper ──────────────────────────────────────────────────────────────────

export default function AdminContentWrapper() {
    const { activeView, role } = useUserDashboardStore();
    const fetchConfig = useTableConfigStore((s) => s.fetchConfig);

    // Sync backend config once on mount so all panels use live permissions
    useEffect(() => { fetchConfig(); }, []);

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
            return <InventoryPanel />;
        case "view-reservations":
            return <AdminReservationsPanel />;
        case "view-accounts":
            return <UsersPanel />;
        case "view-users":
            return <UserProfilesPanel />;
        case "view-reviews":
            return <ReviewsPanel />;
        case "view-bookmarks":
            return <BookmarksPanel />;
        case "view-permissions-admin":
            return <PermissionsPanel roleFilter="admin" />;
        case "view-permissions-staff":
            return <PermissionsPanel roleFilter="staff" />;
        case "create-invoice":
            return <CreateInvoicePanel />;
        case "view-payments":
            return <ViewPaymentsPanel />;
        case "list-data":
            return <CarsListPanel />;
        case "list-reservations":
            return <ReservationsListPanel />;
        case "list-accounts":
            return <AccountsListPanel />;
        case "list-users":
            return <UsersListPanel />;
        case "list-reviews":
            return <ReviewsListPanel />;
        case "list-payments":
            return <PaymentsListPanel />;
        case "admin-dashboard":
        default:
            return <AdminDashboardPanel />;
    }
}
