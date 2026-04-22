"use client";

import { Suspense, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSidebarStore } from "@/stores/sidebarStore";
import { useUserDashboardStore } from "@/stores/userDashboardStore";
import HeaderMenu from "./menus/headerMenu";
import FilterSidebar from "./menus/filterSidebar";
import { useWindowSize } from "@/app/hooks/useWindowSize";
import styles from "./SidebarLayout.module.css";

const SidebarLayout = ({ children }: { children: React.ReactNode }) => {
    const pathname = usePathname();
    useEffect(() => {
        if (pathname !== "/login") {
            sessionStorage.setItem("pre-login-path", pathname);
        }
    }, [pathname]);

    const { openPanel } = useSidebarStore();
    const { width } = useWindowSize();
    const pushContent = openPanel && (width === undefined || width >= 1300);

    const { role, userName, accountId } = useUserDashboardStore();
    const isPrivileged = role === "ADMIN" || role === "STAFF";
    const barBg = role === "ADMIN" ? "#ef4444" : "#3b82f6";

    return (
        <div className={styles.root}>
            <div
                className={styles.content}
                style={{ marginRight: pushContent ? 380 : 0 }}
            >
                {children}
            </div>
            {isPrivileged && (
                <div style={{
                    position: "fixed",
                    top: 12,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: barBg,
                    borderRadius: 9999,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 10px 4px 8px",
                    zIndex: 99999,
                    pointerEvents: "none",
                    userSelect: "none",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                }}>
                    <span style={{ fontSize: "10pt" }}>⚠️</span>
                    <span style={{ fontSize: "7pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.95)" }}>
                        {role}
                    </span>
                    {accountId !== null && (
                        <span style={{ fontSize: "7pt", color: "rgba(255,255,255,0.7)", fontFamily: "monospace" }}>
                            #{accountId}
                        </span>
                    )}
                </div>
            )}
            <HeaderMenu />
            <Suspense>
                <FilterSidebar />
            </Suspense>
        </div>
    );
};

export default SidebarLayout;
