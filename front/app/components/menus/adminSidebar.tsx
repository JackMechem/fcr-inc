"use client";

import { useState, useEffect } from "react";
import { useAdminSidebarStore, AdminView } from "@/stores/adminSidebarStore";
import { useUserDashboardStore } from "@/stores/userDashboardStore";
import { useMobileSidebarStore } from "@/stores/mobileSidebarStore";
import { useWindowSize } from "@/app/hooks/useWindowSize";
import {
    BiCar, BiChevronLeft, BiChevronRight, BiChevronDown,
    BiPlus, BiEdit, BiTable, BiGridAlt, BiX, BiCalendar, BiUser, BiMenu, BiListUl,
} from "react-icons/bi";
import styles from "./adminSidebar.module.css";

type Section = "cars" | "reservations" | "users";

interface SectionDef {
    id: Section;
    icon: React.ReactNode;
    label: string;
    items: { icon: React.ReactNode; label: string; view: AdminView }[];
}

const SECTIONS: SectionDef[] = [
    {
        id: "cars",
        icon: <BiCar />,
        label: "Cars",
        items: [
            { icon: <BiPlus />,    label: "Add Car",     view: "add-car"   },
            { icon: <BiEdit />,    label: "Edit Car",    view: "edit-car"  },
            { icon: <BiTable />,   label: "Table View",  view: "view-data" },
            { icon: <BiListUl />,  label: "List View",   view: "list-data" },
        ],
    },
    {
        id: "reservations",
        icon: <BiCalendar />,
        label: "Reservations",
        items: [
            { icon: <BiTable />,  label: "Table View", view: "view-reservations" },
            { icon: <BiListUl />, label: "List View",  view: "list-reservations" },
        ],
    },
    {
        id: "users",
        icon: <BiUser />,
        label: "Users",
        items: [
            { icon: <BiTable />,  label: "Accounts — Table", view: "view-accounts" },
            { icon: <BiListUl />, label: "Accounts — List",  view: "list-accounts" },
            { icon: <BiTable />,  label: "Profiles — Table", view: "view-users"    },
            { icon: <BiListUl />, label: "Profiles — List",  view: "list-users"    },
        ],
    },
];

// ── Mobile slide-in drawer ────────────────────────────────────────────────────

const MobileSidebar = () => {
    const { activeView, setActiveView } = useAdminSidebarStore();
    const { role } = useUserDashboardStore();
    const { open, setOpen } = useMobileSidebarStore();
    const [openSection, setOpenSection] = useState<Section | null>(
        () => SECTIONS.find((s) => s.items.some((i) => i.view === activeView))?.id ?? null
    );

    useEffect(() => {
        const sectionId = SECTIONS.find((s) => s.items.some((i) => i.view === activeView))?.id;
        if (sectionId) setOpenSection(sectionId);
    }, [activeView]);

    const handleDashboard = () => { setActiveView(null); setOpen(false); };
    const handleSection   = (id: Section) => setOpenSection((prev) => (prev === id ? null : id));
    const pickView        = (view: AdminView) => { setActiveView(view); setOpen(false); };

    return (
        <>
            {/* Overlay */}
            {open && <div className={styles.overlay} onClick={() => setOpen(false)} />}

            {/* Slide-in drawer */}
            <div className={`${styles.mobileDrawer} ${open ? styles.mobileDrawerOpen : ""}`}>
                <div className={styles.mobileDrawerHeader}>
                    <span className={styles.mobileDrawerTitle}>Menu</span>
                    <button className={styles.sheetCloseBtn} onClick={() => setOpen(false)}>
                        <BiX />
                    </button>
                </div>

                <div className={styles.expandedInner}>
                    <div className={styles.navTop}>
                        <button
                            onClick={handleDashboard}
                            className={`${styles.dashBtn} ${activeView === null ? styles.dashBtnActive : ""}`}
                        >
                            <BiGridAlt className={styles.dashBtnIcon} />
                            <span className={styles.dashBtnLabel}>Dashboard</span>
                        </button>
                    </div>
                    <div className={styles.navDivider} />
                    <div className={styles.navSections}>
                        {SECTIONS.map((s) => {
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
                                                        key={String(item.view)}
                                                        onClick={() => pickView(item.view)}
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
                    </div>
                    {role === "ADMIN" && (
                        <div className={styles.adminWarning}>
                            <p className={styles.adminWarningTitle}>⚠ Admin Access</p>
                            <p className={styles.adminWarningBody}>
                                You have <strong>full access</strong> to the live database. Changes are <strong>permanent</strong>.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

// ── Desktop left sidebar ──────────────────────────────────────────────────────

const DesktopSidebar = () => {
    const { collapsed, toggle, activeView, setActiveView } = useAdminSidebarStore();
    const { role } = useUserDashboardStore();
    const [openSection, setOpenSection] = useState<Section | null>(
        () => SECTIONS.find((s) => s.items.some((i) => i.view === activeView))?.id ?? null
    );
    const [flyout, setFlyout] = useState<Section | null>(null);
    const flyoutTimer = useState<ReturnType<typeof setTimeout> | null>(null);

    // Auto-open the section containing the active view (e.g. triggered from outside)
    useEffect(() => {
        const sectionId = SECTIONS.find((s) => s.items.some((i) => i.view === activeView))?.id;
        if (sectionId) setOpenSection(sectionId);
    }, [activeView]);

    const handleDashboard = () => { setActiveView(null); setOpenSection(null); };
    const handleSection   = (id: Section) => setOpenSection((prev) => (prev === id ? null : id));

    const openFlyout  = (id: Section) => {
        if (flyoutTimer[0]) clearTimeout(flyoutTimer[0]);
        setFlyout(id);
    };
    const closeFlyout = () => {
        flyoutTimer[0] = setTimeout(() => setFlyout(null), 120);
    };
    const keepFlyout  = () => {
        if (flyoutTimer[0]) clearTimeout(flyoutTimer[0]);
    };

    const flyoutSection = SECTIONS.find((s) => s.id === flyout);

    return (
        <div className={`${styles.desktop} ${collapsed ? styles.desktopCollapsed : styles.desktopExpanded}`}>
            {collapsed ? (
                /* Collapsed: icon stack with hover flyouts */
                <div className={styles.collapsedStack}>
                    <button
                        onClick={handleDashboard}
                        title="Dashboard"
                        className={`${styles.collapsedIconBtn} ${activeView === null ? styles.collapsedIconBtnActive : ""}`}
                    >
                        <BiGridAlt className={styles.collapsedBtnIcon} />
                    </button>

                    {SECTIONS.map((s) => {
                        const sectionActive = s.items.some((i) => i.view === activeView);
                        return (
                            <div key={s.id} className={styles.collapsedIconWrap}
                                onMouseEnter={() => openFlyout(s.id)}
                                onMouseLeave={closeFlyout}
                            >
                                <button
                                    className={`${styles.collapsedIconBtn} ${sectionActive ? styles.collapsedIconBtnActive : ""}`}
                                >
                                    <span className={styles.collapsedBtnIcon}>{s.icon}</span>
                                </button>

                                {flyout === s.id && flyoutSection && (
                                    <div
                                        className={styles.flyout}
                                        onMouseEnter={keepFlyout}
                                        onMouseLeave={closeFlyout}
                                    >
                                        <p className={styles.flyoutLabel}>{flyoutSection.label}</p>
                                        {flyoutSection.items.map((item) => {
                                            const isActive = activeView === item.view;
                                            return (
                                                <button
                                                    key={String(item.view)}
                                                    onClick={() => { setActiveView(item.view); setFlyout(null); }}
                                                    className={`${styles.flyoutItem} ${isActive ? styles.flyoutItemActive : ""}`}
                                                >
                                                    <span className={`${styles.flyoutItemIcon} ${isActive ? styles.flyoutItemIconActive : ""}`}>
                                                        {item.icon}
                                                    </span>
                                                    <span className={styles.flyoutItemLabel}>{item.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* Expanded: traditional collapsible nav */
                <div className={styles.expandedInner}>
                    <div className={styles.navTop}>
                        <button
                            onClick={handleDashboard}
                            className={`${styles.dashBtn} ${activeView === null ? styles.dashBtnActive : ""}`}
                        >
                            <BiGridAlt className={styles.dashBtnIcon} />
                            <span className={styles.dashBtnLabel}>Dashboard</span>
                        </button>
                    </div>

                    <div className={styles.navDivider} />

                    <div className={styles.navSections}>
                        {SECTIONS.map((s) => {
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
                                                        key={String(item.view)}
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
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {role === "ADMIN" && (
                        <div className={styles.adminWarning}>
                            <p className={styles.adminWarningTitle}>⚠ Admin Access</p>
                            <p className={styles.adminWarningBody}>
                                You have <strong>full access</strong> to the live database. Changes are <strong>permanent</strong>. Do <strong>NOT</strong> tamper with data carelessly.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Toggle button */}
            <button
                onClick={toggle}
                className={styles.toggleBtn}
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                {collapsed
                    ? <BiChevronRight className={styles.toggleBtnIcon} />
                    : <BiChevronLeft className={styles.toggleBtnIcon} />
                }
            </button>
        </div>
    );
};

// ── Export ────────────────────────────────────────────────────────────────────

const AdminSidebar = () => {
    const { width } = useWindowSize();
    if (width === undefined) return null;
    return width < 768 ? <MobileSidebar /> : <DesktopSidebar />;
};

export default AdminSidebar;
