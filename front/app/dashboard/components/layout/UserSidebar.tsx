"use client";

import { useUserDashboardStore, UserDashboardView, DashboardReservation } from "@/stores/userDashboardStore";
import { useWindowSize } from "@/app/hooks/useWindowSize";
import {
    BiCalendar, BiUser, BiChevronLeft, BiChevronRight, BiChevronDown,
    BiLogOut, BiCar, BiPlus, BiEdit, BiTable, BiGridAlt, BiShieldQuarter,
    BiStar, BiBookmark, BiX, BiMenu, BiSlider, BiReceipt, BiListUl, BiGroup, BiIdCard, BiError, BiLineChart,
} from "react-icons/bi";
import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Cookies from "js-cookie";
import { useMobileSidebarStore } from "@/stores/mobileSidebarStore";
import styles from "../../../components/menus/adminSidebar.module.css";

interface NavItem {
    icon: React.ReactNode;
    label: string;
    view: UserDashboardView;
}

interface NavSection {
    id: string;
    icon: React.ReactNode;
    label: string;
    items: NavItem[];
}

const fmtShort = (d: string | number) =>
    new Date(typeof d === "number" ? d * 1000 : new Date(d).getTime())
        .toLocaleDateString("en-US", { month: "short", day: "numeric" });

const toMs = (d: string | number) => typeof d === "number" ? d * 1000 : new Date(d).getTime();

function groupReservations(reservations: DashboardReservation[]) {
    const nowMs = Date.now();
    const threeWeeks = 3 * 7 * 24 * 60 * 60 * 1000;
    return [
        {
            label: "Future",
            items: reservations
                .filter((r) => toMs(r.pickUpTime) > nowMs)
                .sort((a, b) => toMs(a.pickUpTime) - toMs(b.pickUpTime)),
        },
        {
            label: "Active",
            items: reservations
                .filter((r) => toMs(r.pickUpTime) <= nowMs && toMs(r.dropOffTime) > nowMs)
                .sort((a, b) => toMs(a.dropOffTime) - toMs(b.dropOffTime)),
        },
        {
            label: "Recent",
            items: reservations
                .filter((r) => toMs(r.dropOffTime) <= nowMs && toMs(r.dropOffTime) >= nowMs - threeWeeks)
                .sort((a, b) => toMs(b.dropOffTime) - toMs(a.dropOffTime)),
        },
        {
            label: "Past",
            items: reservations
                .filter((r) => toMs(r.dropOffTime) < nowMs - threeWeeks)
                .sort((a, b) => toMs(b.dropOffTime) - toMs(a.dropOffTime)),
        },
    ].filter((g) => g.items.length > 0);
}

const CUSTOMER_ITEMS: NavItem[] = [
    { icon: <BiUser />, label: "My Profile", view: "user-details" },
];

const ADMIN_SECTIONS: NavSection[] = [
    {
        id: "cars",
        icon: <BiCar />,
        label: "Cars",
        items: [
            { icon: <BiPlus />,    label: "Add Car",     view: "add-car"    },
            { icon: <BiEdit />,    label: "Edit Car",    view: "edit-car"   },
            { icon: <BiTable />,   label: "Table View",  view: "view-data"  },
            { icon: <BiListUl />,  label: "List View",   view: "list-data"  },
        ],
    },
    {
        id: "mgmt-reservations",
        icon: <BiCalendar />,
        label: "Reservations",
        items: [
            { icon: <BiTable />,  label: "Table View", view: "view-reservations" },
            { icon: <BiListUl />, label: "List View",  view: "list-reservations" },
        ],
    },
    {
        id: "accounts",
        icon: <BiIdCard />,
        label: "Accounts",
        items: [
            { icon: <BiTable />,  label: "Table View", view: "view-accounts" },
            { icon: <BiListUl />, label: "List View",  view: "list-accounts" },
        ],
    },
    {
        id: "users",
        icon: <BiGroup />,
        label: "Users",
        items: [
            { icon: <BiTable />,  label: "Table View", view: "view-users" },
            { icon: <BiListUl />, label: "List View",  view: "list-users" },
        ],
    },
    {
        id: "reviews",
        icon: <BiStar />,
        label: "Reviews",
        items: [
            { icon: <BiTable />,  label: "Table View", view: "view-reviews" },
            { icon: <BiListUl />, label: "List View",  view: "list-reviews" },
        ],
    },
    {
        id: "bookmarks",
        icon: <BiBookmark />,
        label: "Bookmarks",
        items: [
            { icon: <BiTable />, label: "Table View", view: "view-bookmarks" },
        ],
    },
    {
        id: "payments",
        icon: <BiReceipt />,
        label: "Payments",
        items: [
            { icon: <BiPlus />,   label: "Create Invoice", view: "create-invoice" },
            { icon: <BiTable />,  label: "Table View",     view: "view-payments"  },
            { icon: <BiListUl />, label: "List View",      view: "list-payments"  },
        ],
    },
    {
        id: "stats",
        icon: <BiLineChart />,
        label: "Statistics",
        items: [
            { icon: <BiLineChart />, label: "Reservations", view: "stats-popularity" },
            { icon: <BiReceipt />,   label: "Revenue",       view: "stats-revenue"    },
        ],
    },
];

const ADMIN_VIEWS = new Set<UserDashboardView>([
    "admin-dashboard", "add-car", "edit-car",
    "view-data", "view-reservations", "view-accounts", "view-users", "view-reviews", "view-bookmarks",
    "list-data", "list-reservations", "list-accounts", "list-users", "list-reviews", "list-payments",
    "view-permissions-admin", "view-permissions-staff",
    "create-invoice", "view-payments",
    "stats-popularity",
    "stats-revenue",
]);

const DesktopSidebar = () => {
    const { collapsed, toggle, activeView, setActiveView, userEmail, stripeUserId, role, clearSession, reservations, selectedReservation, openReservation } = useUserDashboardStore();
    const isPrivileged = role === "ADMIN" || role === "STAFF";
    const hasUser = !!stripeUserId;

    const sidebarRef = useRef<HTMLDivElement>(null);
    const [permWarn, setPermWarn] = useState(false);
    const [permWarnCallback, setPermWarnCallback] = useState<(() => void) | null>(null);

    const [openSection, setOpenSection] = useState<string | null>(() => {
        const adminId = ADMIN_SECTIONS.find((s) => s.items.some((i) => i.view === activeView))?.id ?? null;
        if (adminId) return adminId;
        if (activeView === "reservations" || activeView === "view-reservation") return "reservations";
        return null;
    });
    const [flyout, setFlyout] = useState<string | null>(null);
    const [flyoutPos, setFlyoutPos] = useState<{ left: number; top?: number; bottom?: number }>({ left: 0, top: 0 });

    useEffect(() => {
        if (!flyout) return;
        const close = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest("[data-flyout-root]")) setFlyout(null);
        };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, [flyout]);

    useEffect(() => {
        const sectionId = ADMIN_SECTIONS.find((s) => s.items.some((i) => i.view === activeView))?.id
            ?? (activeView === "view-permissions-admin" || activeView === "view-permissions-staff" ? "permissions" : undefined)
            ?? (activeView === "reservations" || activeView === "view-reservation" ? "reservations" : undefined);
        if (sectionId) setOpenSection(sectionId);
    }, [activeView]);

    const handleSection = (id: string) => setOpenSection((prev) => (prev === id ? null : id));
    const toggleFlyout = useCallback((id: string, btn: HTMLElement) => {
        setFlyout((prev) => {
            if (prev === id) return null;
            const rect = btn.getBoundingClientRect();
            const sidebarRight = sidebarRef.current?.getBoundingClientRect().right ?? rect.right;
            const spaceBelow = window.innerHeight - rect.top;
            const anchorBottom = spaceBelow < 220;
            setFlyoutPos(anchorBottom
                ? { left: sidebarRight, bottom: window.innerHeight - rect.bottom }
                : { left: sidebarRight, top: rect.top }
            );
            return id;
        });
    }, []);

    const flyoutSection = ADMIN_SECTIONS.find((s) => s.id === flyout);

    const handleSignOut = () => {
        Cookies.remove("user-session", { path: "/" });
        Cookies.remove("account-id", { path: "/" });
        Cookies.remove("stripe-user-id", { path: "/" });
        Cookies.remove("user-role", { path: "/" });
        clearSession();
    };

    return (
        <div ref={sidebarRef} className={`${styles.desktop} ${collapsed ? styles.desktopCollapsed : styles.desktopExpanded}`}>
            {collapsed ? (
                <div className={styles.collapsedStack}>
                    {hasUser && (
                        <>
                            {/* Reservations — direct nav, no flyout */}
                            <button
                                className={`${styles.collapsedIconBtn} ${(activeView === "reservations" || activeView === "view-reservation") ? styles.collapsedIconBtnActive : ""}`}
                                title="Reservations"
                                onClick={() => setActiveView("reservations")}
                            >
                                <span className={styles.collapsedBtnIcon}><BiCalendar /></span>
                            </button>
                            {/* Other personal items */}
                            {CUSTOMER_ITEMS.map((item) => (
                                <button
                                    key={item.view}
                                    onClick={() => setActiveView(item.view)}
                                    title={item.label}
                                    className={`${styles.collapsedIconBtn} ${activeView === item.view ? styles.collapsedIconBtnActive : ""}`}
                                >
                                    <span className={styles.collapsedBtnIcon}>{item.icon}</span>
                                </button>
                            ))}
                        </>
                    )}
                    {isPrivileged && (
                        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
                            <button
                                onClick={() => setActiveView("admin-dashboard")}
                                title={role === "ADMIN" ? "Admin" : "Staff"}
                                className={`${styles.collapsedIconBtn} ${activeView === "admin-dashboard" ? styles.collapsedIconBtnActive : ""}`}
                            >
                                <span className={styles.collapsedBtnIcon}><BiShieldQuarter /></span>
                            </button>
                            {ADMIN_SECTIONS.map((s) => {
                                const sectionActive = s.items.some((i) => i.view === activeView);
                                return (
                                    <button
                                        key={s.id}
                                        data-flyout-root
                                        className={`${styles.collapsedIconBtn} ${sectionActive ? styles.collapsedIconBtnActive : ""}`}
                                        title={s.label}
                                        onClick={(e) => toggleFlyout(s.id, e.currentTarget)}
                                    >
                                        <span className={styles.collapsedBtnIcon}>{s.icon}</span>
                                    </button>
                                );
                            })}
                            {role === "ADMIN" && (
                                <button
                                    data-flyout-root
                                    className={`${styles.collapsedIconBtn} ${(activeView === "view-permissions-admin" || activeView === "view-permissions-staff") ? styles.collapsedIconBtnActive : ""}`}
                                    title="Permissions"
                                    onClick={(e) => {
                                        const btn = e.currentTarget;
                                        if (flyout === "permissions") { setFlyout(null); return; }
                                        setPermWarn(true);
                                        setPermWarnCallback(() => () => toggleFlyout("permissions", btn));
                                    }}
                                >
                                    <span className={styles.collapsedBtnIcon}><BiSlider /></span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className={styles.expandedInner}>
                    {/* Identity header */}
                    <div className={styles.navTop} style={{ borderBottom: "1px solid var(--color-third)", paddingBottom: 12, marginBottom: 0 }}>
                        <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-foreground-light)", marginBottom: 4, padding: "0 4px" }}>
                            Signed in as
                        </p>
                        <p style={{ fontSize: 12, color: "var(--color-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: "0 4px" }}>
                            {userEmail ?? "—"}
                        </p>
                    </div>

                    <div className={styles.navSections}>
                        {/* Customer nav items */}
                        {hasUser && (
                            <>
                                <div style={{ paddingTop: 8 }}>
                                    <p style={{
                                        fontSize: 9, fontWeight: 600, textTransform: "uppercase",
                                        letterSpacing: "0.06em", padding: "0 4px", marginBottom: 2,
                                        color: "var(--color-foreground-light)",
                                    }}>
                                        Personal
                                    </p>
                                </div>

                                {/* Reservations collapsible section */}
                                {(() => {
                                    const isOpen = openSection === "reservations";
                                    const hasActive = activeView === "reservations" || activeView === "view-reservation";
                                    return (
                                        <div className={`${styles.navSection} ${isOpen ? styles.navSectionOpen : ""}`}>
                                            <button
                                                onClick={() => { setActiveView("reservations"); handleSection("reservations"); }}
                                                className={`${styles.sectionBtn} ${isOpen || hasActive ? styles.sectionBtnOpen : ""}`}
                                            >
                                                <span className={styles.sectionBtnIcon}><BiCalendar /></span>
                                                <span className={styles.sectionBtnLabel}>Reservations</span>
                                                <BiChevronDown className={`${styles.sectionChevron} ${isOpen ? styles.sectionChevronOpen : ""}`} />
                                            </button>
                                            <div className={`${styles.subItemsWrap} ${isOpen ? styles.subItemsWrapOpen : ""}`}>
                                                <div className={styles.subItems}>
                                                    {groupReservations(reservations).filter((g) => g.label === "Future" || g.label === "Active").map((group) => (
                                                        <div key={group.label}>
                                                            <p className={styles.subItemGroupLabel}>{group.label}</p>
                                                            {group.items.map((r) => {
                                                                const isActive = activeView === "view-reservation" && selectedReservation?.reservationId === r.reservationId;
                                                                const label = `${fmtShort(r.pickUpTime)} – ${fmtShort(r.dropOffTime)}`;
                                                                return (
                                                                    <button
                                                                        key={r.reservationId}
                                                                        onClick={() => openReservation(r)}
                                                                        className={`${styles.subItem} ${isActive ? styles.subItemActive : ""}`}
                                                                    >
                                                                        <span className={`${styles.subItemIcon} ${isActive ? styles.subItemIconActive : ""}`}><BiReceipt /></span>
                                                                        <span className={styles.subItemLabel}>{label}</span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Other personal items (My Profile) */}
                                {CUSTOMER_ITEMS.map((item) => (
                                    <button
                                        key={item.view}
                                        onClick={() => setActiveView(item.view)}
                                        className={`${styles.dashBtn} ${activeView === item.view ? styles.dashBtnActive : ""}`}
                                    >
                                        <span className={styles.dashBtnIcon}>{item.icon}</span>
                                        <span className={styles.dashBtnLabel}>{item.label}</span>
                                    </button>
                                ))}
                            </>
                        )}

                    {/* Admin/Staff sections */}
                    {isPrivileged && (
                        <>
                            <div style={{ padding: "6px 0 0" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 4px", marginBottom: 2 }}>
                                    <p style={{
                                        fontSize: 9, fontWeight: 600, textTransform: "uppercase",
                                        letterSpacing: "0.06em",
                                        color: "var(--color-foreground-light)",
                                        margin: 0,
                                    }}>
                                        {role === "ADMIN" ? "Admin" : "Staff"}
                                    </p>
                                    <div style={{ display: "flex", alignItems: "center" }}
                                        onMouseEnter={(e) => {
                                            const el = e.currentTarget.querySelector("[data-warn]") as HTMLElement;
                                            if (!el) return;
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            el.style.display = "block";
                                            el.style.top = `${rect.top + rect.height / 2}px`;
                                            el.style.left = `${rect.right + 8}px`;
                                        }}
                                        onMouseLeave={(e) => { (e.currentTarget.querySelector("[data-warn]") as HTMLElement)?.style.setProperty("display", "none"); }}
                                    >
                                        <BiError style={{ fontSize: 11, color: "#ef4444", cursor: "default", flexShrink: 0 }} />
                                        <div data-warn style={{
                                            display: "none", position: "fixed", transform: "translateY(-50%)", zIndex: 9999,
                                            background: "var(--color-primary)",
                                            border: "1px solid var(--color-third)",
                                            borderRadius: 10, padding: "4px 0", width: 230,
                                            boxShadow: "0 8px 24px rgba(0,0,0,0.2), 0 2px 6px rgba(0,0,0,0.1)",
                                            pointerEvents: "none",
                                        }}>
                                            <p style={{ padding: "6px 14px 3px", fontSize: "7pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#ef4444", opacity: 0.8, margin: 0, userSelect: "none" }}>⚠ Administrator</p>
                                            <div style={{ height: 1, background: "var(--color-third)", margin: "4px 8px" }} />
                                            <p style={{ margin: "0 4px", padding: "6px 10px", fontSize: "9.5pt", color: "#f87171", lineHeight: 1.6, borderRadius: 6 }}>
                                                You have full permissions to <strong style={{ color: "#ef4444" }}>view, mutate, or delete any data</strong> in the database. Changes are <strong style={{ color: "#ef4444" }}>permanent</strong>. Do <strong style={{ color: "#ef4444" }}>NOT</strong> touch anything you are not certain about.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                                <button
                                    onClick={() => setActiveView("admin-dashboard")}
                                    className={`${styles.dashBtn} ${activeView === "admin-dashboard" ? styles.dashBtnActive : ""}`}
                                >
                                    <BiGridAlt className={styles.dashBtnIcon} />
                                    <span className={styles.dashBtnLabel}>Overview</span>
                                </button>

                                {ADMIN_SECTIONS.map((s) => {
                                    const isOpen = openSection === s.id;
                                    const hasActive = s.items.some((i) => i.view === activeView);
                                    return (
                                        <div key={s.id} className={`${styles.navSection} ${isOpen ? styles.navSectionOpen : ""}`}>
                                            <button
                                                onClick={() => handleSection(s.id)}
                                                className={`${styles.sectionBtn} ${isOpen || hasActive ? styles.sectionBtnOpen : ""}`}
                                            >
                                                <span className={styles.sectionBtnIcon}>{s.icon}</span>
                                                <span className={styles.sectionBtnLabel}>{s.label}</span>
                                                <BiChevronDown className={`${styles.sectionChevron} ${isOpen ? styles.sectionChevronOpen : ""}`} />
                                            </button>
                                            <div className={`${styles.subItemsWrap} ${isOpen ? styles.subItemsWrapOpen : ""}`}>
                                                <div className={styles.subItems}>
                                                    {s.items.map((item) => {
                                                        const isActive = activeView === item.view;
                                                        return (
                                                            <button
                                                                key={item.view}
                                                                onClick={() => setActiveView(item.view)}
                                                                className={`${styles.subItem} ${isActive ? styles.subItemActive : ""}`}
                                                            >
                                                                <span className={`${styles.subItemIcon} ${isActive ? styles.subItemIconActive : ""}`}>
                                                                    {item.icon}
                                                                </span>
                                                                <span className={styles.subItemLabel}>{item.label}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </>
                    )}

                    </div>

                    {/* Permissions — pinned to bottom in red, ADMIN only */}
                    {role === "ADMIN" && (() => {
                        const permViews = ["view-permissions-admin", "view-permissions-staff"] as const;
                        const isOpen = openSection === "permissions";
                        const hasActive = permViews.some((v) => v === activeView);
                        return (
                            <div style={{ padding: "0 10px 8px" }}>
                                <div className={styles.navDivider} style={{ marginBottom: 6 }} />
                                <div className={`${styles.navSection} ${isOpen ? styles.navSectionOpen : ""}`} style={isOpen ? { backgroundColor: "rgba(239,68,68,0.08)", borderRadius: 9, padding: 4 } : {}}>
                                    <button
                                        onClick={() => {
                                            if (!isOpen && !hasActive) {
                                                setPermWarn(true);
                                                setPermWarnCallback(() => () => handleSection("permissions"));
                                            } else {
                                                handleSection("permissions");
                                            }
                                        }}
                                        className={styles.sectionBtn}
                                        style={{ color: "#ef4444" }}
                                    >
                                        <span className={styles.sectionBtnIcon}><BiSlider /></span>
                                        <span className={styles.sectionBtnLabel}>Permissions</span>
                                        <BiChevronDown className={`${styles.sectionChevron} ${isOpen ? styles.sectionChevronOpen : ""}`} style={{ color: "#ef4444", opacity: 0.7 }} />
                                    </button>
                                    <div className={`${styles.subItemsWrap} ${isOpen ? styles.subItemsWrapOpen : ""}`}>
                                        <div className={styles.subItems}>
                                            {permViews.map((v) => {
                                                const label = v === "view-permissions-admin" ? "Admin" : "Staff";
                                                const isActive = activeView === v;
                                                return (
                                                    <button
                                                        key={v}
                                                        onClick={() => setActiveView(v)}
                                                        className={`${styles.subItem} ${isActive ? styles.subItemActive : ""}`}
                                                        style={{ color: isActive ? "#ef4444" : undefined }}
                                                    >
                                                        <span className={styles.subItemIcon} style={{ color: "inherit" }}><BiSlider /></span>
                                                        <span className={styles.subItemLabel}>{label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Sign out */}
                    <div style={{ padding: "0 10px 12px", marginTop: role === "ADMIN" ? 0 : "auto" }}>
                        <div className={styles.navDivider} style={{ marginBottom: 8 }} />
                        <button onClick={handleSignOut} className={styles.dashBtn}>
                            <BiLogOut className={styles.dashBtnIcon} />
                            <span className={styles.dashBtnLabel}>Sign Out</span>
                        </button>
                    </div>
                </div>
            )}
            {/* Permissions warning modal */}
            {permWarn && typeof document !== "undefined" && createPortal(
                <div style={{
                    position: "fixed", inset: 0, zIndex: 99999,
                    background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
                    display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
                }}>
                    <div style={{
                        background: "#0f0f0f", border: "2px solid #ef4444",
                        borderRadius: 16, padding: "32px 28px", maxWidth: 420, width: "100%",
                        boxShadow: "0 0 60px rgba(239,68,68,0.25)",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                            <BiError style={{ fontSize: 36, color: "#ef4444", flexShrink: 0 }} />
                            <p style={{ fontSize: 15, fontWeight: 800, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.06em", lineHeight: 1.2 }}>
                                RESTRICTED AREA — DO NOT PROCEED UNLESS AUTHORIZED
                            </p>
                        </div>
                        <p style={{ fontSize: 13, color: "#f87171", lineHeight: 1.7, marginBottom: 12 }}>
                            You are about to access the <strong style={{ color: "#ef4444" }}>Permissions Control Panel</strong>. This section governs <strong style={{ color: "#ef4444" }}>who can access, modify, and destroy data</strong> across the entire platform.
                        </p>
                        <p style={{ fontSize: 13, color: "#f87171", lineHeight: 1.7, marginBottom: 12 }}>
                            Misconfiguring permissions can result in <strong style={{ color: "#ef4444" }}>unauthorized data access, irreversible data loss, and complete system compromise</strong>. Do not touch anything unless you know exactly what you are doing.
                        </p>
                        <p style={{ fontSize: 12, color: "#ef4444", lineHeight: 1.6, marginBottom: 24, opacity: 0.85 }}>
                            If you were not explicitly directed here by a senior administrator, <strong>close this now</strong>. All actions in this panel are logged.
                        </p>
                        <div style={{ display: "flex", gap: 10 }}>
                            <button
                                onClick={() => setPermWarn(false)}
                                style={{
                                    flex: 1, padding: "10px 0", borderRadius: 8,
                                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                                    color: "#ccc", fontSize: 13, fontWeight: 600, cursor: "pointer",
                                }}
                            >
                                Get me out of here
                            </button>
                            <button
                                onClick={() => { setPermWarn(false); permWarnCallback?.(); setPermWarnCallback(null); }}
                                style={{
                                    flex: 1, padding: "10px 0", borderRadius: 8,
                                    background: "#ef4444", border: "none",
                                    color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                                }}
                            >
                                I understand — proceed
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <button onClick={toggle} className={styles.toggleBtn}>
                {collapsed
                    ? <BiChevronRight className={styles.toggleBtnIcon} />
                    : <BiChevronLeft className={styles.toggleBtnIcon} />}
            </button>
            {/* Portaled flyout — renders outside sidebar to avoid z-index/overflow clipping */}
            {flyout && typeof document !== "undefined" && createPortal(
                <div
                    data-flyout-root
                    className={styles.flyout}
                    style={{
                        left: flyoutPos.left,
                        ...(flyoutPos.top !== undefined ? { top: flyoutPos.top } : { bottom: flyoutPos.bottom }),
                        maxWidth: `calc(100vw - ${flyoutPos.left}px - 8px)`,
                        maxHeight: `calc(100vh - 16px)`,
                        overflowY: "auto",
                    }}
                >
                    {flyout === "permissions" ? (
                        <>
                            <p className={styles.flyoutLabel}>Permissions</p>
                            <div className={styles.flyoutDivider} />
                            {(["view-permissions-admin", "view-permissions-staff"] as const).map((v) => {
                                const label = v === "view-permissions-admin" ? "Admin" : "Staff";
                                const isActive = activeView === v;
                                return (
                                    <button
                                        key={v}
                                        onClick={() => { setActiveView(v); setFlyout(null); }}
                                        className={`${styles.flyoutItem} ${isActive ? styles.flyoutItemActive : ""}`}
                                    >
                                        <span className={`${styles.flyoutItemIcon} ${isActive ? styles.flyoutItemIconActive : ""}`}><BiSlider /></span>
                                        <span className={styles.flyoutItemLabel}>{label}</span>
                                    </button>
                                );
                            })}
                        </>
                    ) : flyoutSection ? (
                        <>
                            <p className={styles.flyoutLabel}>{flyoutSection.label}</p>
                            <div className={styles.flyoutDivider} />
                            {flyoutSection.items.map((item) => {
                                const isActive = activeView === item.view;
                                return (
                                    <button
                                        key={item.view}
                                        onClick={() => { setActiveView(item.view); setFlyout(null); }}
                                        className={`${styles.flyoutItem} ${isActive ? styles.flyoutItemActive : ""}`}
                                    >
                                        <span className={`${styles.flyoutItemIcon} ${isActive ? styles.flyoutItemIconActive : ""}`}>{item.icon}</span>
                                        <span className={styles.flyoutItemLabel}>{item.label}</span>
                                    </button>
                                );
                            })}
                        </>
                    ) : null}
                </div>,
                document.body
            )}
        </div>
    );
};

const MobileSidebar = () => {
    const { activeView, setActiveView, userEmail, stripeUserId, role, clearSession, reservations, selectedReservation, openReservation } = useUserDashboardStore();
    const isPrivileged = role === "ADMIN" || role === "STAFF";
    const hasUser = !!stripeUserId;
    const { open, setOpen } = useMobileSidebarStore();
    const [openSection, setOpenSection] = useState<string | null>(() => {
        const adminId = ADMIN_SECTIONS.find((s) => s.items.some((i) => i.view === activeView))?.id ?? null;
        if (adminId) return adminId;
        if (activeView === "reservations" || activeView === "view-reservation") return "reservations";
        return null;
    });

    useEffect(() => {
        const sectionId = ADMIN_SECTIONS.find((s) => s.items.some((i) => i.view === activeView))?.id
            ?? (activeView === "reservations" || activeView === "view-reservation" ? "reservations" : undefined);
        if (sectionId) setOpenSection(sectionId);
    }, [activeView]);

    const pick = (view: UserDashboardView) => { setActiveView(view); setOpen(false); };
    const handleSection = (id: string) => setOpenSection((prev) => (prev === id ? null : id));

    const handleSignOut = () => {
        Cookies.remove("user-session", { path: "/" });
        Cookies.remove("account-id", { path: "/" });
        Cookies.remove("stripe-user-id", { path: "/" });
        Cookies.remove("user-role", { path: "/" });
        clearSession();
        setOpen(false);
    };

    return (
        <>
            {/* Full-screen overlay menu */}
            {open && (
                <div className={styles.mobileFullMenu}>
                    {/* Header */}
                    <div className={styles.mobileDrawerHeader}>
                        <div>
                            <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-foreground-light)", marginBottom: 2 }}>
                                Signed in as
                            </p>
                            <p style={{ fontSize: 12, color: "var(--color-foreground)" }}>
                                {userEmail ?? "—"}
                            </p>
                        </div>
                        <button className={styles.sheetCloseBtn} onClick={() => setOpen(false)}>
                            <BiX />
                        </button>
                    </div>

                    {/* Nav */}
                    <div className={styles.navSections} style={{ flex: 1 }}>
                        {hasUser && (
                            <>
                                <p style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", padding: "8px 4px 4px", color: "var(--color-foreground-light)" }}>
                                    Personal
                                </p>

                                {/* Reservations collapsible section */}
                                {(() => {
                                    const isOpen = openSection === "reservations";
                                    const hasActive = activeView === "reservations" || activeView === "view-reservation";
                                    return (
                                        <div className={styles.navSection}>
                                            <button
                                                onClick={() => { pick("reservations"); setOpenSection((prev) => prev === "reservations" ? null : "reservations"); }}
                                                className={`${styles.sectionBtn} ${isOpen || hasActive ? styles.sectionBtnOpen : ""}`}
                                            >
                                                <span className={styles.sectionBtnIcon}><BiCalendar /></span>
                                                <span className={styles.sectionBtnLabel}>Reservations</span>
                                                <BiChevronDown className={`${styles.sectionChevron} ${isOpen ? styles.sectionChevronOpen : ""}`} />
                                            </button>
                                            {isOpen && (
                                                <div className={styles.subItems}>
                                                    {groupReservations(reservations).filter((g) => g.label === "Future" || g.label === "Active").map((group) => (
                                                        <div key={group.label}>
                                                            <p className={styles.subItemGroupLabel}>{group.label}</p>
                                                            {group.items.map((r) => {
                                                                const isActive = activeView === "view-reservation" && selectedReservation?.reservationId === r.reservationId;
                                                                const label = `${fmtShort(r.pickUpTime)} – ${fmtShort(r.dropOffTime)}`;
                                                                return (
                                                                    <button
                                                                        key={r.reservationId}
                                                                        onClick={() => { openReservation(r); setOpen(false); }}
                                                                        className={`${styles.subItem} ${isActive ? styles.subItemActive : ""}`}
                                                                    >
                                                                        <span className={`${styles.subItemIcon} ${isActive ? styles.subItemIconActive : ""}`}><BiReceipt /></span>
                                                                        <span className={styles.subItemLabel}>{label}</span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}

                                {/* My Profile */}
                                {CUSTOMER_ITEMS.map((item) => (
                                    <button
                                        key={item.view}
                                        onClick={() => pick(item.view)}
                                        className={`${styles.dashBtn} ${activeView === item.view ? styles.dashBtnActive : ""}`}
                                    >
                                        <span className={styles.dashBtnIcon}>{item.icon}</span>
                                        <span className={styles.dashBtnLabel}>{item.label}</span>
                                    </button>
                                ))}
                            </>
                        )}

                        {isPrivileged && (
                            <>
                                <p style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", padding: "8px 4px 4px", color: "var(--color-foreground-light)" }}>
                                    {role === "ADMIN" ? "Admin" : "Staff"}
                                </p>
                                <button
                                    onClick={() => pick("admin-dashboard")}
                                    className={`${styles.dashBtn} ${activeView === "admin-dashboard" ? styles.dashBtnActive : ""}`}
                                >
                                    <BiGridAlt className={styles.dashBtnIcon} />
                                    <span className={styles.dashBtnLabel}>Overview</span>
                                </button>
                                {ADMIN_SECTIONS.map((s) => {
                                    const isOpen = openSection === s.id;
                                    const hasActive = s.items.some((i) => i.view === activeView);
                                    return (
                                        <div key={s.id} className={styles.navSection}>
                                            <button
                                                onClick={() => handleSection(s.id)}
                                                className={`${styles.sectionBtn} ${isOpen || hasActive ? styles.sectionBtnOpen : ""}`}
                                            >
                                                <span className={styles.sectionBtnIcon}>{s.icon}</span>
                                                <span className={styles.sectionBtnLabel}>{s.label}</span>
                                                <BiChevronDown className={`${styles.sectionChevron} ${isOpen ? styles.sectionChevronOpen : ""}`} />
                                            </button>
                                            {isOpen && (
                                                <div className={styles.subItems}>
                                                    {s.items.map((item) => {
                                                        const isActive = activeView === item.view;
                                                        return (
                                                            <button
                                                                key={item.view}
                                                                onClick={() => pick(item.view)}
                                                                className={`${styles.subItem} ${isActive ? styles.subItemActive : ""}`}
                                                            >
                                                                <span className={`${styles.subItemIcon} ${isActive ? styles.subItemIconActive : ""}`}>
                                                                    {item.icon}
                                                                </span>
                                                                <span className={styles.subItemLabel}>{item.label}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                {role === "ADMIN" && (() => {
                                    const permViews = ["view-permissions-admin", "view-permissions-staff"] as const;
                                    const isOpen = openSection === "permissions";
                                    const hasActive = permViews.some((v) => v === activeView);
                                    return (
                                        <div className={styles.navSection}>
                                            <button
                                                onClick={() => handleSection("permissions")}
                                                className={`${styles.sectionBtn} ${isOpen || hasActive ? styles.sectionBtnOpen : ""}`}
                                            >
                                                <span className={styles.sectionBtnIcon}><BiSlider /></span>
                                                <span className={styles.sectionBtnLabel}>Permissions</span>
                                                <BiChevronDown className={`${styles.sectionChevron} ${isOpen ? styles.sectionChevronOpen : ""}`} />
                                            </button>
                                            {isOpen && (
                                                <div className={styles.subItems}>
                                                    {permViews.map((v) => {
                                                        const label = v === "view-permissions-admin" ? "Admin" : "Staff";
                                                        const isActive = activeView === v;
                                                        return (
                                                            <button
                                                                key={v}
                                                                onClick={() => pick(v)}
                                                                className={`${styles.subItem} ${isActive ? styles.subItemActive : ""}`}
                                                            >
                                                                <span className={`${styles.subItemIcon} ${isActive ? styles.subItemIconActive : ""}`}>
                                                                    <BiSlider />
                                                                </span>
                                                                <span className={styles.subItemLabel}>{label}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </>
                        )}
                    </div>

                    {/* Sign out */}
                    <div style={{ padding: "0 10px 20px" }}>
                        <div className={styles.navDivider} style={{ marginBottom: 8 }} />
                        <button onClick={handleSignOut} className={styles.dashBtn}>
                            <BiLogOut className={styles.dashBtnIcon} />
                            <span className={styles.dashBtnLabel}>Sign Out</span>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

const UserSidebar = () => {
    const { width } = useWindowSize();
    if (width === undefined) return null;
    return width < 768 ? <MobileSidebar /> : <DesktopSidebar />;
};

export default UserSidebar;
