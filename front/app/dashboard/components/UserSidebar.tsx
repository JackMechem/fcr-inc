"use client";

import { useUserDashboardStore, UserDashboardView } from "@/stores/userDashboardStore";
import { useWindowSize } from "@/app/hooks/useWindowSize";
import { BiCalendar, BiUser, BiChevronLeft, BiChevronRight, BiLogOut } from "react-icons/bi";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import styles from "../../components/menus/adminSidebar.module.css";

const NAV_ITEMS: { icon: React.ReactNode; label: string; view: UserDashboardView }[] = [
    { icon: <BiCalendar />, label: "Reservations",  view: "reservations"  },
    { icon: <BiUser />,     label: "My Profile",    view: "user-details"  },
];

const DesktopSidebar = () => {
    const { collapsed, toggle, activeView, setActiveView, userEmail, stripeUserId, setUserEmail, clearSession } = useUserDashboardStore();

    const handleSignOut = () => {
        Cookies.remove("user-session", { path: "/" });
        Cookies.remove("account-id", { path: "/" });
        Cookies.remove("stripe-user-id", { path: "/" });
        Cookies.remove("user-role", { path: "/" });
        clearSession();
    };

    useEffect(() => {
        if (!userEmail && stripeUserId) {
            fetch(`/api/users/${stripeUserId}`)
                .then((r) => r.json())
                .then((u) => { if (u?.email) setUserEmail(u.email); })
                .catch(() => {});
        }
    }, [stripeUserId]);

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
                    <div className={styles.navTop} style={{ borderBottom: "1px solid var(--color-third)", paddingBottom: 12, marginBottom: 0 }}>
                        <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-foreground-light)", marginBottom: 4, padding: "0 4px" }}>
                            Signed in as
                        </p>
                        <p style={{ fontSize: 12, color: "var(--color-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: "0 4px" }}>
                            {userEmail ?? "—"}
                        </p>
                    </div>

                    <div className={styles.navDivider} />

                    <div className={styles.navSections}>
                        {NAV_ITEMS.map((item) => (
                            <button
                                key={item.view}
                                onClick={() => setActiveView(item.view)}
                                className={`${styles.dashBtn} ${activeView === item.view ? styles.dashBtnActive : ""}`}
                            >
                                <span className={styles.dashBtnIcon}>{item.icon}</span>
                                <span className={styles.dashBtnLabel}>{item.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Sign out */}
                    <div style={{ padding: "0 10px 12px", marginTop: "auto" }}>
                        <div className={styles.navDivider} style={{ marginBottom: 8 }} />
                        <button onClick={handleSignOut} className={styles.dashBtn}>
                            <BiLogOut className={styles.dashBtnIcon} />
                            <span className={styles.dashBtnLabel}>Sign Out</span>
                        </button>
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
