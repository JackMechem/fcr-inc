import { UserDashboardView } from "@/stores/userDashboardStore";

export interface ViewEntry { view: UserDashboardView; label: string; }
export interface ViewSection {
    heading: string;
    items: ViewEntry[];
}

export const PANE_VIEW_SECTIONS: ViewSection[] = [
    {
        heading: "Dashboard",
        items: [
            { view: "admin-dashboard", label: "Overview" },
        ],
    },
    {
        heading: "Tables",
        items: [
            { view: "view-data",         label: "Cars" },
            { view: "view-reservations", label: "Reservations" },
            { view: "view-accounts",     label: "Accounts" },
            { view: "view-users",        label: "Users" },
            { view: "view-reviews",      label: "Reviews" },
            { view: "view-bookmarks",    label: "Bookmarks" },
            { view: "view-payments",     label: "Payments" },
        ],
    },
    {
        heading: "Lists",
        items: [
            { view: "list-data",         label: "Cars" },
            { view: "list-reservations", label: "Reservations" },
            { view: "list-accounts",     label: "Accounts" },
            { view: "list-users",        label: "Users" },
            { view: "list-reviews",      label: "Reviews" },
            { view: "list-payments",     label: "Payments" },
        ],
    },
    {
        heading: "Analytics",
        items: [
            { view: "stats-popularity", label: "Popularity" },
            { view: "stats-revenue",    label: "Revenue" },
        ],
    },
    {
        heading: "Tools",
        items: [
            { view: "create-invoice",               label: "Create Invoice" },
            { view: "csv-generator",                label: "CSV Generator" },
            { view: "api-test-guest-checkout",      label: "Guest Checkout" },
            { view: "api-test-create-reservation",  label: "Create Reservation" },
            { view: "api-test-webhook",             label: "Stripe Webhook" },
        ],
    },
];
