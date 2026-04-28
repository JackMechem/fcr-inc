"use client";

import { useUserDashboardStore } from "@/stores/userDashboardStore";
import { useWindowSize } from "@/app/hooks/useWindowSize";
import { BiX } from "react-icons/bi";
import SplitViewPicker from "./SplitViewPicker";
import ViewRenderer from "./ViewRenderer";

const TABLE_VIEWS = new Set([
    "view-data", "view-reservations", "view-accounts", "view-users",
    "view-reviews", "view-bookmarks", "view-payments",
    "stats-popularity", "stats-revenue",
]);

interface CardProps {
    isTableView: boolean;
    isMobile: boolean;
    pane: "main" | "split";
    children: React.ReactNode;
}

function ViewCard({ isTableView, isMobile, pane, children }: CardProps) {
    const { setSplitView } = useUserDashboardStore();

    return (
        <div style={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
        }}>
            <div style={{
                backgroundColor: "var(--color-primary)",
                borderRadius: 16,
                border: "1px solid var(--color-third)",
                boxShadow: isTableView ? "none" : "0 2px 16px rgba(0, 0, 0, 0.06)",
                flex: 1,
                minHeight: 0,
                overflow: isTableView ? "hidden" : "auto",
                display: "flex",
                flexDirection: "column",
                boxSizing: "border-box",
            }}>
                {/* Frame strip */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: 4,
                    padding: "4px 8px",
                    borderBottom: "1px solid var(--color-third)",
                    flexShrink: 0,
                }}>
                    <SplitViewPicker pane={pane} />
                    {pane === "split" && (
                        <button
                            onClick={() => setSplitView(null)}
                            title="Close split"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                padding: "3px 4px",
                                borderRadius: 6,
                                border: "1px solid var(--color-third)",
                                background: "transparent",
                                color: "var(--color-foreground-light)",
                                cursor: "pointer",
                            }}
                        >
                            <BiX size={13} />
                        </button>
                    )}
                </div>

                {/* Panel content */}
                <div style={{
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

export default function DashboardContentArea({ children }: { children: React.ReactNode }) {
    const { collapsed, activeView, splitView } = useUserDashboardStore();
    const { width } = useWindowSize();
    const isMobile = width !== undefined && width < 768;
    const isMainTableView = TABLE_VIEWS.has(activeView);
    const isSplitTableView = splitView ? TABLE_VIEWS.has(splitView) : false;

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
                flexDirection: "row",
                gap: pad,
                boxSizing: "border-box",
            }}>
                <ViewCard isTableView={isMainTableView} isMobile={isMobile} pane="main">
                    {children}
                </ViewCard>

                {splitView && (
                    <ViewCard isTableView={isSplitTableView} isMobile={isMobile} pane="split">
                        <ViewRenderer view={splitView} />
                    </ViewCard>
                )}
            </div>
        </div>
    );
}
