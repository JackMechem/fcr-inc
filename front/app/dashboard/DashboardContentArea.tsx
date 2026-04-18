"use client";

import { useUserDashboardStore } from "@/stores/userDashboardStore";
import { useWindowSize } from "@/app/hooks/useWindowSize";

export default function DashboardContentArea({ children }: { children: React.ReactNode }) {
    const { collapsed } = useUserDashboardStore();
    const { width } = useWindowSize();
    const isMobile = width !== undefined && width < 768;

    return (
        <div
            style={{
                paddingLeft: isMobile ? 0 : collapsed ? 64 : 220,
                paddingBottom: isMobile ? 80 : 0,
                backgroundColor: "var(--color-primary)",
                minHeight: "calc(100vh - 65px)",
                transition: "padding-left 300ms ease-in-out",
            }}
        >
            <div style={{ padding: isMobile ? "8px" : "10px" }}>
                <div style={{
                    backgroundColor: "var(--color-primary)",
                    borderRadius: "16px",
                    border: "1px solid var(--color-third)",
                    boxShadow: "0 2px 16px rgba(0, 0, 0, 0.06)",
                    minHeight: "calc(100vh - 65px - 20px)",
                    padding: isMobile ? "24px 16px 60px" : "36px 40px 60px",
                }}>
                    {children}
                </div>
            </div>
        </div>
    );
}
