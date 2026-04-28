"use client";

import { UserDashboardView } from "@/stores/userDashboardStore";
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
import PopularityPanel from "@/app/admin/components/panels/PopularityPanel";
import RevenuePanel from "@/app/admin/components/panels/RevenuePanel";
import CsvGeneratorPanel from "@/app/admin/components/panels/CsvGeneratorPanel";
import ApiTesterPanel from "@/app/dashboard/components/panels/ApiTesterPanel";
import ReservationsPanel from "../panels/ReservationsPanel";
import ReservationDetailPanel from "../panels/ReservationDetailPanel";
import EditReservationPanel from "../panels/EditReservationPanel";
import UserDetailsPanel from "../panels/UserDetailsPanel";
import PaymentsPanel from "../panels/PaymentsPanel";

interface Props {
    view: UserDashboardView;
}

export default function ViewRenderer({ view }: Props) {
    switch (view) {
        case "add-car":
            return (
                <div style={{ padding: "36px 40px" }}>
                    <h1 className="page-title" style={{ marginBottom: 24 }}>Add Car</h1>
                    <CarFormPanel mode="add" />
                </div>
            );
        case "edit-car":
            return (
                <div style={{ padding: "36px 40px" }}>
                    <h1 className="page-title" style={{ marginBottom: 24 }}>Edit Car</h1>
                    <CarFormPanel mode="edit" />
                </div>
            );
        case "view-data":           return <InventoryPanel />;
        case "view-reservations":   return <AdminReservationsPanel />;
        case "view-accounts":       return <UsersPanel />;
        case "view-users":          return <UserProfilesPanel />;
        case "view-reviews":        return <ReviewsPanel />;
        case "view-bookmarks":      return <BookmarksPanel />;
        case "view-permissions-admin": return <PermissionsPanel roleFilter="admin" />;
        case "view-permissions-staff": return <PermissionsPanel roleFilter="staff" />;
        case "create-invoice":      return <CreateInvoicePanel />;
        case "view-payments":       return <ViewPaymentsPanel />;
        case "list-data":           return <CarsListPanel />;
        case "list-reservations":   return <ReservationsListPanel />;
        case "list-accounts":       return <AccountsListPanel />;
        case "list-users":          return <UsersListPanel />;
        case "list-reviews":        return <ReviewsListPanel />;
        case "list-payments":       return <PaymentsListPanel />;
        case "stats-popularity":    return <PopularityPanel />;
        case "stats-revenue":       return <RevenuePanel />;
        case "csv-generator":       return <CsvGeneratorPanel />;
        case "api-test-guest-checkout":      return <ApiTesterPanel flowKey="guest-checkout" />;
        case "api-test-create-reservation":  return <ApiTesterPanel flowKey="create-reservation" />;
        case "api-test-webhook":             return <ApiTesterPanel flowKey="stripe-webhook" />;
        case "view-reservation":    return <ReservationDetailPanel />;
        case "edit-reservation":    return <EditReservationPanel />;
        case "user-details":        return <UserDetailsPanel />;
        case "user-payments":       return <PaymentsPanel />;
        case "reservations":        return <ReservationsPanel />;
        case "admin-dashboard":
        default:
            return <AdminDashboardPanel />;
    }
}
