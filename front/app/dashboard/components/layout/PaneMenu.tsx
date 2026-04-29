"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { BiDotsHorizontalRounded, BiPlus, BiEdit, BiX, BiChevronRight, BiChevronLeft } from "react-icons/bi";
import { UserDashboardView } from "@/stores/userDashboardStore";
import { usePaneContext } from "./PaneContext";
import { PANE_VIEW_SECTIONS as SECTIONS } from "./paneViewSections";

// ── Styles (matching adminSidebar flyout / subItem) ───────────────────────────

const menuBox: React.CSSProperties = {
    background: "var(--color-primary)",
    border: "1px solid var(--color-third)",
    borderRadius: 10,
    boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
    padding: "4px 0",
};

/** Matches .flyoutItem / .subItem from adminSidebar.module.css */
const navItem: React.CSSProperties = {
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "calc(100% - 8px)",
    margin: "0 4px",
    padding: "6px 10px",
    fontSize: "9.5pt",
    color: "var(--color-foreground)",
    background: "transparent",
    border: "1px solid transparent",
    borderRadius: 6,
    cursor: "pointer",
    transition: "background-color 0.1s",
    textAlign: "left",
};

/** Matches .subItemGroupLabel */
const groupLabel: React.CSSProperties = {
    padding: "6px 14px 2px",
    fontSize: 8,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "var(--color-foreground-light)",
    opacity: 0.7,
};

const divider: React.CSSProperties = {
    height: 1,
    background: "var(--color-third)",
    margin: "4px 8px",
};

function hoverHandlers(active = false) {
    const activeBg   = "color-mix(in srgb, var(--color-accent) 22%, transparent)";
    const activeBdr  = "color-mix(in srgb, var(--color-accent) 35%, transparent)";
    return {
        onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
            const el = e.currentTarget as HTMLElement;
            if (!active) el.style.background = "var(--color-primary-dark)";
        },
        onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = active ? activeBg : "transparent";
            el.style.borderColor = active ? activeBdr : "transparent";
        },
    };
}

// ── View list (used for both "Add" and "Change") ──────────────────────────────

function ViewList({ title, currentView, onSelect, onBack }: {
    title: string;
    currentView: UserDashboardView;
    onSelect: (v: UserDashboardView) => void;
    onBack: () => void;
}) {
    const activeBg  = "color-mix(in srgb, var(--color-accent) 22%, transparent)";
    const activeBdr = "color-mix(in srgb, var(--color-accent) 35%, transparent)";

    return (
        <div style={{ minWidth: 210, maxHeight: 400, overflowY: "auto" }}>
            {/* Back button */}
            <button
                onClick={onBack}
                style={{
                    ...navItem,
                    color: "var(--color-foreground-light)",
                    marginBottom: 2,
                }}
                {...hoverHandlers()}
            >
                <BiChevronLeft size={14} /> {title}
            </button>
            <div style={divider} />

            {SECTIONS.map((section, si) => (
                <div key={section.heading}>
                    {si > 0 && <div style={divider} />}
                    <div style={groupLabel}>{section.heading}</div>
                    {section.items.map(({ view, label }) => {
                        const active = view === currentView;
                        return (
                            <button
                                key={view}
                                onClick={() => onSelect(view)}
                                style={{
                                    ...navItem,
                                    background: active ? activeBg : "transparent",
                                    borderColor: active ? activeBdr : "transparent",
                                    color: active ? "var(--color-accent)" : "var(--color-foreground)",
                                    fontWeight: active ? 600 : 400,
                                }}
                                {...hoverHandlers(active)}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

type MenuState =
    | { type: "main" }
    | { type: "view-add"; dir: "vertical" | "horizontal" }
    | { type: "view-change" };

interface Props { paneId: string; currentView: UserDashboardView; }

export default function PaneMenu({ paneId, currentView }: Props) {
    const { onSplit, onClose, onSetView, totalPanes } = usePaneContext();

    const [open, setOpen]           = useState(false);
    const [menuState, setMenuState] = useState<MenuState>({ type: "main" });
    const [addHovered, setAddHovered] = useState(false);

    // Position of the main menu
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
    // Position of the "Add window" row (for flyout alignment)
    const [flyoutY, setFlyoutY]  = useState(0);
    // Right edge of the main menu (for flyout X)
    const [menuRight, setMenuRight] = useState(0);

    const btnRef     = useRef<HTMLButtonElement>(null);
    const menuRef    = useRef<HTMLDivElement>(null);
    const flyoutRef  = useRef<HTMLDivElement>(null);
    const addRowRef  = useRef<HTMLButtonElement>(null);
    const hoverTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // Click outside to close
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            const t = e.target as Node;
            if (
                !menuRef.current?.contains(t) &&
                !flyoutRef.current?.contains(t) &&
                !btnRef.current?.contains(t)
            ) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    // Recalculate flyout position when menu renders
    useEffect(() => {
        if (open && menuRef.current) {
            const r = menuRef.current.getBoundingClientRect();
            setMenuRight(r.right);
        }
    }, [open, menuState]);

    const handleOpen = (e: React.MouseEvent) => {
        e.stopPropagation();
        const rect = btnRef.current?.getBoundingClientRect();
        if (!rect) return;
        setMenuPos({ top: rect.bottom + 6, left: rect.left + rect.width / 2 });
        setMenuState({ type: "main" });
        setAddHovered(false);
        setOpen((o) => !o);
    };

    // Hover helpers with timeout so mouse can travel to the flyout
    const showFlyout = () => {
        clearTimeout(hoverTimeout.current);
        const rect = addRowRef.current?.getBoundingClientRect();
        if (rect) setFlyoutY(rect.top);
        setAddHovered(true);
    };
    const hideFlyout = () => {
        hoverTimeout.current = setTimeout(() => setAddHovered(false), 120);
    };

    const handleAddDir = (dir: "vertical" | "horizontal") => {
        setAddHovered(false);
        setMenuState({ type: "view-add", dir });
    };

    const handleAddView = (view: UserDashboardView) => {
        if (menuState.type !== "view-add") return;
        onSplit(paneId, menuState.dir, view);
        setOpen(false);
    };

    const handleChangeView = (view: UserDashboardView) => {
        onSetView(paneId, view);
        setOpen(false);
    };

    const triggerBtn = (
        <button
            ref={btnRef}
            onClick={handleOpen}
            title="Pane options"
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1px 6px",
                borderRadius: "0 0 6px 6px",
                border: "1px solid transparent",
                borderTop: "none",
                background: "var(--color-accent)",
                color: "var(--color-primary)",
                cursor: "pointer",
                overflow: "hidden",
                transition: "background 120ms, border-color 120ms",
            }}
            onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.background = "color-mix(in srgb, var(--color-accent) 80%, white)";
                el.style.borderColor = "color-mix(in srgb, var(--color-accent) 60%, transparent)";
            }}
            onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.background = "var(--color-accent)";
                el.style.borderColor = "transparent";
            }}
        >
            <BiDotsHorizontalRounded size={13} />
        </button>
    );

    if (!open) return triggerBtn;

    return (
        <>
            {triggerBtn}

            {/* Main menu — separate portal so transform doesn't break fixed positioning */}
            {createPortal(
                <div
                    ref={menuRef}
                    style={{
                        position: "fixed",
                        top: menuPos.top,
                        left: menuPos.left,
                        transform: "translateX(-50%)",
                        zIndex: 9999,
                        minWidth: 200,
                        ...menuBox,
                    }}
                >
                    {menuState.type === "main" && (
                        <>
                            {/* Add window */}
                            <button
                                ref={addRowRef}
                                style={{ ...navItem, justifyContent: "space-between" }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-primary-dark)"; showFlyout(); }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; hideFlyout(); }}
                            >
                                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <BiPlus size={14} />
                                    Add window
                                </span>
                                <BiChevronRight size={13} style={{ color: "var(--color-foreground-light)", flexShrink: 0 }} />
                            </button>

                            {/* Change window */}
                            <button
                                style={navItem}
                                onClick={() => setMenuState({ type: "view-change" })}
                                {...hoverHandlers()}
                            >
                                <BiEdit size={14} />
                                Change window
                            </button>

                            {/* Close window */}
                            {totalPanes > 1 && (
                                <>
                                    <div style={divider} />
                                    <button
                                        style={{ ...navItem, color: "var(--color-foreground-light)" }}
                                        onClick={() => { onClose(paneId); setOpen(false); }}
                                        {...hoverHandlers()}
                                    >
                                        <BiX size={14} />
                                        Close window
                                    </button>
                                </>
                            )}
                        </>
                    )}

                    {menuState.type === "view-add" && (
                        <ViewList
                            title={`Add ${menuState.dir}`}
                            currentView={currentView}
                            onSelect={handleAddView}
                            onBack={() => setMenuState({ type: "main" })}
                        />
                    )}

                    {menuState.type === "view-change" && (
                        <ViewList
                            title="Change window"
                            currentView={currentView}
                            onSelect={handleChangeView}
                            onBack={() => setMenuState({ type: "main" })}
                        />
                    )}
                </div>,
                document.body,
            )}

            {/* Direction flyout — separate portal so it's positioned correctly relative to viewport */}
            {open && menuState.type === "main" && addHovered && createPortal(
                <div
                    ref={flyoutRef}
                    style={{
                        position: "fixed",
                        top: flyoutY,
                        left: menuRight + 2,
                        zIndex: 10000,
                        minWidth: 140,
                        ...menuBox,
                    }}
                    onMouseEnter={() => { clearTimeout(hoverTimeout.current); setAddHovered(true); }}
                    onMouseLeave={hideFlyout}
                >
                    {(["vertical", "horizontal"] as const).map((d) => (
                        <button
                            key={d}
                            style={{ ...navItem, textTransform: "capitalize" }}
                            onClick={() => handleAddDir(d)}
                            {...hoverHandlers()}
                        >
                            {d}
                        </button>
                    ))}
                </div>,
                document.body,
            )}
        </>
    );
}
