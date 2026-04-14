"use client";

import { useUserDashboardStore, UserDashboardView } from "@/stores/userDashboardStore";
import { useWindowSize } from "@/app/hooks/useWindowSize";
import { BiCalendar, BiUser, BiChevronLeft, BiChevronRight } from "react-icons/bi";
import { useState } from "react";
import styles from "../../components/menus/adminSidebar.module.css";

const NAV_ITEMS: { icon: React.ReactNode; label: string; view: UserDashboardView }[] = [
    { icon: <BiCalendar />, label: "Reservations",  view: "reservations"  },
    { icon: <BiUser />,     label: "My Profile",    view: "user-details"  },
];

const DesktopSidebar = () => {
    const { collapsed, toggle, activeView, setActiveView, isAuthenticated, userEmail } = useUserDashboardStore();

    return (
        <div className={`${styles.desktop} ${collapsed ? styles.desktopCollapsed : styles.desktopExpanded}`}>
            {collapsed ? (
                <div className={styles.collapsedStack}>
                    {NAV_ITEMS.map((item) => (
                        <button
                            key={item.view}
                            onClick={() => setActiveView(item.view)}
                            title={item.label}
                            className={`${styles.collapsedIconBtn} ${activeView === item.view ? styles.collapsedIconBtnActive : ""}`}
                        >
                            <span className={styles.collapsedBtnIcon}>{item.icon}</span>
                        </button>
                    ))}
                </div>
            ) : (
                <div className={styles.expandedInner}>
                    {/* Identity header */}
                    <div style={{ padding: "16px 16px 8px", borderBottom: "1px solid var(--color-third)", marginBottom: 8 }}>
                        <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-foreground-light)", marginBottom: 2 }}>
                            {isAuthenticated ? "Signed in as" : "Viewing as guest"}
                        </p>
                        <p style={{ fontSize: 13, color: "var(--color-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {userEmail ?? "—"}
                        </p>
                    </div>

                    <div className={styles.expandedItems}>
                        {NAV_ITEMS.map((item) => (
                            <button
                                key={item.view}
                                onClick={() => setActiveView(item.view)}
                                className={`${styles.expandedItem} ${activeView === item.view ? styles.expandedItemActive : ""}`}
                            >
                                <span className={`${styles.expandedItemIcon} ${activeView === item.view ? styles.expandedItemIconActive : ""}`}>
                                    {item.icon}
                                </span>
                                <span className={styles.expandedItemLabel}>{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
            <button onClick={toggle} className={styles.toggleBtn}>
                {collapsed
                    ? <BiChevronRight className={styles.toggleBtnIcon} />
                    : <BiChevronLeft className={styles.toggleBtnIcon} />}
            </button>
        </div>
    );
};

const MobileSidebar = () => {
    const { activeView, setActiveView } = useUserDashboardStore();
    const [sheetOpen, setSheetOpen] = useState(false);

    return (
        <>
            <div className={styles.mobileBar}>
                {NAV_ITEMS.map((item) => (
                    <button
                        key={item.view}
                        onClick={() => { setActiveView(item.view); setSheetOpen(false); }}
                        className={`${styles.mobileTabBtn} ${activeView === item.view ? styles.mobileTabBtnActive : ""}`}
                    >
                        <span className={styles.mobileTabIcon}>{item.icon}</span>
                        <span className={styles.mobileTabLabel}>{item.label}</span>
                    </button>
                ))}
            </div>
            {sheetOpen && <div className={styles.overlay} onClick={() => setSheetOpen(false)} />}
        </>
    );
};

const UserSidebar = () => {
    const { width } = useWindowSize();
    if (width === undefined) return null;
    return width < 768 ? <MobileSidebar /> : <DesktopSidebar />;
};

export default UserSidebar;
