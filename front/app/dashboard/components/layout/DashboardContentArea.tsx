"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { createPortal } from "react-dom";
import { useUserDashboardStore, UserDashboardView } from "@/stores/userDashboardStore";
import { useWindowSize } from "@/app/hooks/useWindowSize";
import { PaneTree, PaneLeaf, PaneContainer } from "./paneTypes";
import { splitLeaf, closeLeaf, updateLeafView, getLeafView, getFirstLeafId, countLeaves, setContainerSizes, getAllLeafViews } from "./paneUtils";
import { PaneContext, PaneContextValue, usePaneContext } from "./PaneContext";
import { CurrentPaneContext } from "./CurrentPaneContext";
import WindowControls from "./WindowControls";
import ViewRenderer from "./ViewRenderer";
import TabBar from "./TabBar";
import { usePaneTabStore } from "@/stores/paneTabStore";
import styles from "./dashboardLayout.module.css";

const TABLE_VIEWS = new Set([
    "view-data", "view-reservations", "view-accounts", "view-users",
    "view-reviews", "view-bookmarks", "view-payments",
    "stats-popularity", "stats-revenue",
]);

// ── Resize handle ─────────────────────────────────────────────────────────────

interface ResizeHandleProps {
    containerId: string;
    index: number; // handle between children[index] and children[index+1]
    dir: "vertical" | "horizontal"; // container direction
    sizes: number[];
    containerRef: React.RefObject<HTMLDivElement | null>;
    pad: number;
}

function ResizeHandle({ containerId, index, dir, sizes, containerRef, pad }: ResizeHandleProps) {
    const { onResizeSplit } = usePaneContext();
    const isCol = dir === "vertical"; // vertical container → side by side → col-resize handle

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const totalPx = isCol ? rect.width : rect.height;
        const totalRatio = sizes.reduce((a, b) => a + b, 0);

        const startPos = isCol ? e.clientX : e.clientY;
        const startSizes = [...sizes];

        const onMove = (mv: MouseEvent) => {
            const delta = (isCol ? mv.clientX : mv.clientY) - startPos;
            const deltaRatio = (delta / totalPx) * totalRatio;

            const next = [...startSizes];
            const minRatio = totalRatio * 0.08; // 8% minimum

            next[index]     = Math.max(minRatio, startSizes[index] + deltaRatio);
            next[index + 1] = Math.max(minRatio, startSizes[index + 1] - deltaRatio);

            // If either would go below min, clamp both
            if (next[index] < minRatio) {
                next[index]     = minRatio;
                next[index + 1] = startSizes[index] + startSizes[index + 1] - minRatio;
            } else if (next[index + 1] < minRatio) {
                next[index + 1] = minRatio;
                next[index]     = startSizes[index] + startSizes[index + 1] - minRatio;
            }

            onResizeSplit(containerId, next);
        };

        const onUp = () => {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        };

        document.body.style.cursor = isCol ? "col-resize" : "row-resize";
        document.body.style.userSelect = "none";
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
    }, [containerId, index, dir, sizes, containerRef, onResizeSplit, isCol]);

    return (
        <div
            className={isCol ? styles.resizeHandleCol : styles.resizeHandleRow}
            style={{ [isCol ? "width" : "height"]: pad }}
            onMouseDown={handleMouseDown}
        />
    );
}

// ── Leaf card ─────────────────────────────────────────────────────────────────

interface LeafCardProps {
    leaf: PaneLeaf;
}

const LeafCard = memo(function LeafCard({ leaf }: LeafCardProps) {
    const { focusedPaneId, totalPanes, fullscreenPaneId, onFocus } = usePaneContext();
    const isFocused = leaf.id === focusedPaneId;
    const isFullscreen = leaf.id === fullscreenPaneId;
    const isTableView = TABLE_VIEWS.has(leaf.view);

    const card = (
        <CurrentPaneContext.Provider value={{ paneId: leaf.id, totalPanes }}>
            <div
                className={styles.paneWrapper}
                onClick={() => onFocus(leaf.id, leaf.view)}
                style={isFullscreen ? { position: "fixed", inset: 0, zIndex: 9998, borderRadius: 0 } : undefined}
            >
                <div className={styles.cardOuter}>
                    <div className={`${styles.windowControls} ${isFullscreen ? styles.windowControlsFullscreen : ""}`}>
                        <WindowControls paneId={leaf.id} currentView={leaf.view} />
                    </div>

                    <div style={{
                        backgroundColor: "var(--color-primary)",
                        borderRadius: isFullscreen ? 0 : 16,
                        border: totalPanes > 1 && isFocused
                            ? "1.5px solid var(--color-accent)"
                            : "1px solid var(--color-third)",
                        boxShadow: isTableView ? "none" : "0 2px 16px rgba(0,0,0,0.06)",
                        flex: 1,
                        minHeight: 0,
                        padding: isTableView ? 0 : "36px 40px",
                        overflow: isTableView ? "hidden" : "auto",
                        display: "flex",
                        flexDirection: "column",
                        boxSizing: "border-box",
                        transition: "border-color 150ms",
                    }}>
                        <ViewRenderer view={leaf.view} />
                    </div>
                </div>
            </div>
        </CurrentPaneContext.Provider>
    );

    if (isFullscreen && typeof document !== "undefined") {
        return createPortal(card, document.body);
    }
    return card;
});

// ── Recursive tree renderer ───────────────────────────────────────────────────

interface RenderTreeProps {
    node: PaneTree;
    pad: number;
}

function RenderTree({ node, pad }: RenderTreeProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    if (node.type === "leaf") {
        return <LeafCard leaf={node} />;
    }

    const container = node as PaneContainer;
    const isCol = container.dir === "vertical";

    return (
        <div
            ref={containerRef}
            style={{
                flex: 1,
                minWidth: 0,
                minHeight: 0,
                display: "flex",
                flexDirection: isCol ? "row" : "column",
            }}
        >
            {container.children.map((child, i) => (
                <React.Fragment key={child.type === "leaf" ? child.id : child.id}>
                    <div style={{
                        flex: container.sizes[i] ?? 1,
                        minWidth: 0,
                        minHeight: 0,
                        display: "flex",
                        flexDirection: isCol ? "row" : "column",
                    }}>
                        <RenderTree
                            node={child}
                            pad={pad}
                        />
                    </div>
                    {i < container.children.length - 1 && (
                        <ResizeHandle
                            containerId={container.id}
                            index={i}
                            dir={container.dir}
                            sizes={container.sizes}
                            containerRef={containerRef}
                            pad={pad}
                        />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function DashboardContentArea() {
    const { collapsed, activeView, setActiveView, setOpenPaneViews } = useUserDashboardStore();
    const { width } = useWindowSize();
    const isMobile = width !== undefined && width < 768;

    const { tabs, activeTabId, updateActiveTab } = usePaneTabStore();
    const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];

    const paneTree = activeTab?.paneTree ?? { type: "leaf" as const, id: "root", view: activeView };
    const focusedPaneId = activeTab?.focusedPaneId ?? "root";
    const total = countLeaves(paneTree);

    const setPaneTree = useCallback((updater: PaneTree | ((t: PaneTree) => PaneTree)) => {
        const current = usePaneTabStore.getState().tabs.find(
            (t) => t.id === usePaneTabStore.getState().activeTabId
        )?.paneTree ?? paneTree;
        const next = typeof updater === "function" ? updater(current) : updater;
        updateActiveTab({ paneTree: next });
    }, [updateActiveTab]);

    const setFocusedPaneId = useCallback((id: string) => {
        updateActiveTab({ focusedPaneId: id });
    }, [updateActiveTab]);

    // Sync non-focused pane views into the store so the sidebar can highlight them
    useEffect(() => {
        const all = getAllLeafViews(paneTree);
        setOpenPaneViews(all.filter((v) => v !== activeView));
    }, [paneTree, activeView, setOpenPaneViews]);

    // When switching tabs, sync activeView to focused pane's view
    const prevTabId = useRef(activeTabId);
    useEffect(() => {
        if (activeTabId !== prevTabId.current) {
            prevTabId.current = activeTabId;
            const view = getLeafView(paneTree, focusedPaneId);
            if (view) {
                prevActiveView.current = view;
                setActiveView(view as Parameters<typeof setActiveView>[0]);
            }
        }
    }, [activeTabId]);

    // Keep a ref so callbacks can read latest tree without stale closure
    const paneTreeRef = useRef(paneTree);
    useEffect(() => { paneTreeRef.current = paneTree; }, [paneTree]);

    // Sidebar navigation → sync into focused pane's view
    const prevActiveView = useRef(activeView);
    useEffect(() => {
        if (activeView !== prevActiveView.current) {
            prevActiveView.current = activeView;
            const next = updateLeafView(paneTreeRef.current, focusedPaneId, activeView);
            updateActiveTab({ paneTree: next });
        }
    }, [activeView, focusedPaneId, updateActiveTab]);

    const handleFocus = useCallback((paneId: string, view: UserDashboardView) => {
        if (paneId === usePaneTabStore.getState().tabs.find(
            (t) => t.id === usePaneTabStore.getState().activeTabId
        )?.focusedPaneId) return;
        updateActiveTab({ focusedPaneId: paneId });
        prevActiveView.current = view;
        setActiveView(view as Parameters<typeof setActiveView>[0]);
    }, [updateActiveTab, setActiveView]);

    const handleSplit = useCallback((paneId: string, dir: "vertical" | "horizontal", newView: UserDashboardView) => {
        const newLeafId = Math.random().toString(36).slice(2, 9);
        const newContainerId = Math.random().toString(36).slice(2, 9);
        const current = usePaneTabStore.getState().tabs.find(
            (t) => t.id === usePaneTabStore.getState().activeTabId
        )?.paneTree;
        if (!current) return;
        updateActiveTab({ paneTree: splitLeaf(current, paneId, dir, newView, newLeafId, newContainerId) });
    }, [updateActiveTab]);

    const handleClose = useCallback((paneId: string) => {
        const state = usePaneTabStore.getState();
        const tab = state.tabs.find((t) => t.id === state.activeTabId);
        if (!tab) return;
        const next = closeLeaf(tab.paneTree, paneId);
        if (!next) return;
        const patch: Partial<typeof tab> = { paneTree: next };
        if (paneId === tab.focusedPaneId) {
            const firstId = getFirstLeafId(next);
            const view = getLeafView(next, firstId);
            patch.focusedPaneId = firstId;
            if (view) {
                prevActiveView.current = view;
                setActiveView(view as Parameters<typeof setActiveView>[0]);
            }
        }
        updateActiveTab(patch);
    }, [updateActiveTab, setActiveView]);

    const handleSetView = useCallback((paneId: string, view: UserDashboardView) => {
        const current = usePaneTabStore.getState().tabs.find(
            (t) => t.id === usePaneTabStore.getState().activeTabId
        )?.paneTree;
        if (!current) return;
        updateActiveTab({ paneTree: updateLeafView(current, paneId, view) });
        const tab = usePaneTabStore.getState().tabs.find(
            (t) => t.id === usePaneTabStore.getState().activeTabId
        );
        if (tab && paneId === tab.focusedPaneId) {
            prevActiveView.current = view;
            setActiveView(view as Parameters<typeof setActiveView>[0]);
        }
    }, [updateActiveTab, setActiveView]);

    const handleResizeSplit = useCallback((containerId: string, sizes: number[]) => {
        const current = usePaneTabStore.getState().tabs.find(
            (t) => t.id === usePaneTabStore.getState().activeTabId
        )?.paneTree;
        if (!current) return;
        updateActiveTab({ paneTree: setContainerSizes(current, containerId, sizes) });
    }, [updateActiveTab]);

    const [fullscreenPaneId, setFullscreenPaneId] = useState<string | null>(null);
    const handleToggleFullscreen = useCallback((paneId: string) => {
        setFullscreenPaneId((prev) => prev === paneId ? null : paneId);
    }, []);

    useEffect(() => {
        if (fullscreenPaneId && !getLeafView(paneTree, fullscreenPaneId)) {
            setFullscreenPaneId(null);
        }
    }, [paneTree, fullscreenPaneId]);

    // Clear fullscreen on tab switch
    useEffect(() => { setFullscreenPaneId(null); }, [activeTabId]);

    const ctxValue = useMemo<PaneContextValue>(() => ({
        focusedPaneId,
        totalPanes: total,
        fullscreenPaneId,
        onFocus: handleFocus,
        onSplit: handleSplit,
        onClose: handleClose,
        onSetView: handleSetView,
        onResizeSplit: handleResizeSplit,
        onToggleFullscreen: handleToggleFullscreen,
    }), [focusedPaneId, total, fullscreenPaneId, handleFocus, handleSplit, handleClose, handleSetView, handleResizeSplit, handleToggleFullscreen]);

    const navH = 65;
    const isTableView = TABLE_VIEWS.has(activeView);

    if (isMobile) {
        return (
            <div style={{
                paddingLeft: 0,
                backgroundColor: "var(--color-primary)",
                height: `calc(100vh - ${navH}px)`,
                display: "flex",
                flexDirection: "column",
            }}>
                <div style={{
                    padding: "8px",
                    flex: 1,
                    minHeight: 0,
                    display: "flex",
                    boxSizing: "border-box",
                }}>
                    <div style={{
                        backgroundColor: "var(--color-primary)",
                        borderRadius: 16,
                        border: "1px solid var(--color-third)",
                        flex: 1,
                        minHeight: 0,
                        padding: isTableView ? 0 : "24px 16px",
                        overflow: isTableView ? "hidden" : "auto",
                        display: "flex",
                        flexDirection: "column",
                        boxSizing: "border-box",
                    }}>
                        <ViewRenderer view={activeView} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <PaneContext.Provider value={ctxValue}>
            <div style={{
                paddingLeft: collapsed ? 54 : 220,
                backgroundColor: "var(--color-primary)",
                height: `calc(100vh - ${navH}px)`,
                display: "flex",
                flexDirection: "column",
                transition: "padding-left 300ms ease-in-out",
            }}>
                <TabBar />
                <div style={{
                    padding: "10px",
                    flex: 1,
                    minHeight: 0,
                    display: "flex",
                    boxSizing: "border-box",
                }}>
                    <RenderTree
                        node={paneTree}
                        pad={10}
                    />
                </div>
            </div>
        </PaneContext.Provider>
    );
}

