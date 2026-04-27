"use client";

import { useUserDashboardStore } from "@/stores/userDashboardStore";
import { useWindowSize } from "@/app/hooks/useWindowSize";

const TABLE_VIEWS = new Set(["view-data", "view-reservations", "view-accounts", "view-users", "view-reviews", "view-bookmarks", "view-payments", "stats-popularity", "stats-revenue"]);

export default function DashboardContentArea({ children }: { children: React.ReactNode }) {
    const { collapsed, activeView } = useUserDashboardStore();
    const { width } = useWindowSize();
    const isMobile = width !== undefined && width < 768;
    const isTableView = TABLE_VIEWS.has(activeView);

    const navH = 65;
    const pad = isMobile ? 8 : 10;

    return (
        <div
            style={{
                paddingLeft: isMobile ? 0 : collapsed ? 54 : 220,
                backgroundColor: "var(--color-primary)",
                height: `calc(100vh - ${navH}px)`,
                display: "flex",
                flexDirection: "column",
                transition: "padding-left 300ms ease-in-out",
            }}
        >
            <div style={{
                padding: `${pad}px`,
                flex: 1,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
                boxSizing: "border-box",
            }}>
                <div style={{
                    backgroundColor: "var(--color-primary)",
                    borderRadius: "16px",
                    border: "1px solid var(--color-third)",
                    boxShadow: isTableView ? "none" : "0 2px 16px rgba(0, 0, 0, 0.06)",
                    flex: 1,
                    minHeight: 0,
                    padding: isTableView ? 0 : isMobile ? "24px 16px" : "36px 40px",
                    overflow: isTableView ? "hidden" : "auto",
                    display: "flex",
                    flexDirection: "column",
                    boxSizing: "border-box",
                }}>
                    {children}
                </div>
            </div>
        </div>
    );
}
