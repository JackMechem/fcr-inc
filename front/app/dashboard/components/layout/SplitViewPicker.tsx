"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { BiColumns } from "react-icons/bi";
import { useUserDashboardStore, UserDashboardView } from "@/stores/userDashboardStore";

interface ViewEntry {
    view: UserDashboardView;
    label: string;
}

interface Section {
    heading: string;
    items: ViewEntry[];
}

const SECTIONS: Section[] = [
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
        heading: "List Views",
        items: [
            { view: "list-data",         label: "Cars (List)" },
            { view: "list-reservations", label: "Reservations (List)" },
            { view: "list-accounts",     label: "Accounts (List)" },
            { view: "list-users",        label: "Users (List)" },
            { view: "list-reviews",      label: "Reviews (List)" },
            { view: "list-payments",     label: "Payments (List)" },
        ],
    },
    {
        heading: "Statistics",
        items: [
            { view: "stats-popularity", label: "Popularity" },
            { view: "stats-revenue",    label: "Revenue" },
        ],
    },
    {
        heading: "Tools",
        items: [
            { view: "admin-dashboard", label: "Overview" },
            { view: "create-invoice",  label: "Create Invoice" },
            { view: "csv-generator",   label: "CSV Generator" },
            { view: "api-test-guest-checkout",     label: "API: Guest Checkout" },
            { view: "api-test-create-reservation", label: "API: Create Reservation" },
            { view: "api-test-webhook",            label: "API: Stripe Webhook" },
        ],
    },
];

interface Props {
    /** Which pane this picker is attached to — "main" or "split" */
    pane: "main" | "split";
}

export default function SplitViewPicker({ pane }: Props) {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0 });
    const btnRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const { setSplitView, activeView, splitView } = useUserDashboardStore();

    const currentView = pane === "main" ? activeView : splitView;

    const handleOpen = (e: React.MouseEvent) => {
        e.stopPropagation();
        const rect = btnRef.current?.getBoundingClientRect();
        if (!rect) return;
        setPos({ top: rect.bottom + 4, left: rect.left });
        setOpen((o) => !o);
    };

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (!menuRef.current?.contains(e.target as Node) && !btnRef.current?.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const handleSelect = (view: UserDashboardView) => {
        setSplitView(view);
        setOpen(false);
    };

    return (
        <>
            <button
                ref={btnRef}
                onClick={handleOpen}
                title="Open in split"
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "3px 8px",
                    borderRadius: 6,
                    border: "1px solid var(--color-third)",
                    background: open ? "var(--color-third)" : "transparent",
                    color: "var(--color-foreground-light)",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 500,
                }}
            >
                <BiColumns size={13} />
                Split
            </button>

            {open && createPortal(
                <div
                    ref={menuRef}
                    style={{
                        position: "fixed",
                        top: pos.top,
                        left: pos.left,
                        zIndex: 9999,
                        background: "var(--color-primary)",
                        border: "1px solid var(--color-third)",
                        borderRadius: 8,
                        boxShadow: "0 4px 24px rgba(0,0,0,0.13)",
                        minWidth: 200,
                        maxHeight: 400,
                        overflowY: "auto",
                        padding: "4px 0",
                    }}
                >
                    {SECTIONS.map((section, si) => (
                        <div key={section.heading}>
                            {si > 0 && (
                                <div style={{
                                    height: 1,
                                    background: "var(--color-third)",
                                    margin: "4px 0",
                                }} />
                            )}
                            <div style={{
                                padding: "4px 12px 2px",
                                fontSize: 9,
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                color: "var(--color-foreground-light)",
                            }}>
                                {section.heading}
                            </div>
                            {section.items.map(({ view, label }) => (
                                <button
                                    key={view}
                                    onClick={() => handleSelect(view)}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        width: "100%",
                                        padding: "5px 12px",
                                        background: view === currentView ? "var(--color-third)" : "transparent",
                                        border: "none",
                                        color: "var(--color-foreground)",
                                        fontSize: 12,
                                        cursor: "pointer",
                                        textAlign: "left",
                                        gap: 8,
                                    }}
                                    onMouseEnter={(e) => {
                                        if (view !== currentView)
                                            (e.currentTarget as HTMLButtonElement).style.background = "var(--color-secondary)";
                                    }}
                                    onMouseLeave={(e) => {
                                        (e.currentTarget as HTMLButtonElement).style.background =
                                            view === currentView ? "var(--color-third)" : "transparent";
                                    }}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    ))}
                </div>,
                document.body,
            )}
        </>
    );
}
