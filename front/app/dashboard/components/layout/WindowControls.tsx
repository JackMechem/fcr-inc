"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
    BiX, BiChevronLeft, BiFullscreen, BiExitFullscreen, BiRefresh, BiDockRight, BiDockBottom,
    BiCar, BiCalendar, BiIdCard, BiGroup, BiStar, BiBookmark, BiReceipt,
    BiPlus, BiData, BiCode, BiLineChart, BiGridAlt, BiTable, BiListUl,
} from "react-icons/bi";
import { UserDashboardView } from "@/stores/userDashboardStore";
import { usePaneContext } from "./PaneContext";
import { PANE_VIEW_SECTIONS } from "./paneViewSections";

// ── Per-view icons ─────────────────────────────────────────────────────────────

const VIEW_ICONS: Partial<Record<UserDashboardView, React.ReactNode>> = {
    "admin-dashboard":            <BiGridAlt size={13} />,
    "view-data":                  <BiCar size={13} />,
    "view-reservations":          <BiCalendar size={13} />,
    "view-accounts":              <BiIdCard size={13} />,
    "view-users":                 <BiGroup size={13} />,
    "view-reviews":               <BiStar size={13} />,
    "view-bookmarks":             <BiBookmark size={13} />,
    "view-payments":              <BiReceipt size={13} />,
    "list-data":                  <BiCar size={13} />,
    "list-reservations":          <BiCalendar size={13} />,
    "list-accounts":              <BiIdCard size={13} />,
    "list-users":                 <BiGroup size={13} />,
    "list-reviews":               <BiStar size={13} />,
    "list-payments":              <BiReceipt size={13} />,
    "stats-popularity":           <BiLineChart size={13} />,
    "stats-revenue":              <BiReceipt size={13} />,
    "create-invoice":             <BiPlus size={13} />,
    "csv-generator":              <BiData size={13} />,
    "api-test-guest-checkout":    <BiCode size={13} />,
    "api-test-create-reservation":<BiCode size={13} />,
    "api-test-webhook":           <BiCode size={13} />,
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const MENU_BOX: React.CSSProperties = {
    background: "var(--color-primary)",
    border: "1px solid var(--color-third)",
    borderRadius: 10,
    boxShadow: "0 8px 24px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.1)",
    padding: "6px 0 4px",
};

interface Props { paneId: string; currentView: UserDashboardView; }

type Menu = "change-view" | "split-v" | "split-h";

export default function WindowControls({ paneId, currentView }: Props) {
    const { totalPanes, fullscreenPaneId, onClose, onSplit, onSetView, onToggleFullscreen } = usePaneContext();
    const isFullscreen = fullscreenPaneId === paneId;

    const [menu, setMenu] = useState<Menu | null>(null);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
    const changeViewBtnRef = useRef<HTMLButtonElement>(null);
    const splitVBtnRef = useRef<HTMLButtonElement>(null);
    const splitHBtnRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [hovered, setHovered] = useState(false);

    useEffect(() => {
        if (!menu) return;
        const handler = (e: MouseEvent) => {
            if (!menuRef.current?.contains(e.target as Node) &&
                !changeViewBtnRef.current?.contains(e.target as Node) &&
                !splitVBtnRef.current?.contains(e.target as Node) &&
                !splitHBtnRef.current?.contains(e.target as Node)) {
                setMenu(null);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [menu]);

    const openAt = useCallback((ref: React.RefObject<HTMLButtonElement | null>, m: Menu) => {
        const rect = ref.current?.getBoundingClientRect();
        if (rect) setMenuPos({ top: rect.bottom + 6, left: rect.left });
        setMenu((prev) => prev === m ? null : m);
    }, []);

    // Clamp menu to viewport after it renders (same pattern as SpreadsheetTable context menu)
    useEffect(() => {
        if (!menu || !menuRef.current) return;
        const r = menuRef.current.getBoundingClientRect();
        const pad = 8;
        let { left, top } = menuPos;
        if (r.right  > window.innerWidth  - pad) left = window.innerWidth  - r.width  - pad;
        if (r.left   < pad)                       left = pad;
        if (r.bottom > window.innerHeight - pad)  top  = window.innerHeight - r.height - pad;
        if (left !== menuPos.left || top !== menuPos.top) setMenuPos({ top, left });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [menu]);

    const btnEnter: React.MouseEventHandler<HTMLButtonElement> = (e) => {
        e.currentTarget.style.background = "color-mix(in srgb, var(--color-foreground) 10%, transparent)";
        e.currentTarget.style.color = "var(--color-foreground)";
    };
    const btnLeave: React.MouseEventHandler<HTMLButtonElement> = (e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = "var(--color-foreground-light)";
    };

    const BTN: React.CSSProperties = {
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "5px", background: "transparent", border: "none",
        borderRadius: 9999, color: "var(--color-foreground-light)",
        cursor: "pointer", transition: "color 120ms, background-color 120ms", flexShrink: 0,
    };

    const splitDir = menu === "split-v" ? "vertical" : menu === "split-h" ? "horizontal" : null;

    const handlePick = (view: UserDashboardView) => {
        if (menu === "change-view") onSetView(paneId, view);
        else if (splitDir) onSplit(paneId, splitDir, view);
        setMenu(null);
    };

    return (
        <>
            <div
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                style={{
                    display: "flex", alignItems: "center", gap: 2,
                    padding: "3px 4px", borderRadius: 9999,
                    border: `1px solid ${hovered ? "color-mix(in srgb, var(--color-accent) 35%, transparent)" : "var(--color-third)"}`,
                    background: hovered ? "color-mix(in srgb, var(--color-accent) 10%, var(--color-primary))" : "var(--color-primary)",
                    boxShadow: hovered ? "none" : "0 1px 4px rgba(0,0,0,0.15)",
                    transition: "background 150ms, border-color 150ms, box-shadow 150ms",
                }}
            >
                {totalPanes > 1 && (
                    <button onClick={(e) => { e.stopPropagation(); onClose(paneId); }} title="Close pane" style={BTN} onMouseEnter={btnEnter} onMouseLeave={btnLeave}>
                        <BiX size={14} />
                    </button>
                )}
                <button ref={changeViewBtnRef} onClick={(e) => { e.stopPropagation(); openAt(changeViewBtnRef, "change-view"); }} title="Change view"
                    style={{ ...BTN, color: menu === "change-view" ? "var(--color-accent)" : "var(--color-foreground-light)" }}
                    onMouseEnter={btnEnter} onMouseLeave={btnLeave}>
                    <BiRefresh size={14} />
                </button>
                <button ref={splitVBtnRef} onClick={(e) => { e.stopPropagation(); openAt(splitVBtnRef, "split-v"); }} title="Tile right"
                    style={{ ...BTN, color: menu === "split-v" ? "var(--color-accent)" : "var(--color-foreground-light)" }}
                    onMouseEnter={btnEnter} onMouseLeave={btnLeave}>
                    <BiDockRight size={14} />
                </button>
                <button ref={splitHBtnRef} onClick={(e) => { e.stopPropagation(); openAt(splitHBtnRef, "split-h"); }} title="Tile down"
                    style={{ ...BTN, color: menu === "split-h" ? "var(--color-accent)" : "var(--color-foreground-light)" }}
                    onMouseEnter={btnEnter} onMouseLeave={btnLeave}>
                    <BiDockBottom size={14} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onToggleFullscreen(paneId); }} title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                    style={BTN} onMouseEnter={btnEnter} onMouseLeave={btnLeave}>
                    {isFullscreen ? <BiExitFullscreen size={13} /> : <BiFullscreen size={13} />}
                </button>
            </div>

            {menu && typeof document !== "undefined" && createPortal(
                <div ref={menuRef} style={{ position: "fixed", top: menuPos.top, left: menuPos.left, zIndex: 9999, width: 230, maxHeight: 480, overflowY: "auto", ...MENU_BOX }}>
                    {/* Title */}
                    <p style={{ margin: 0, padding: "2px 12px 8px", fontSize: "11pt", fontWeight: 600, color: "var(--color-foreground)" }}>
                        {menu === "change-view" ? "Switch View" : menu === "split-v" ? "Tile Right" : "Tile Down"}
                    </p>

                    {PANE_VIEW_SECTIONS.map((section, si) => (
                        <div key={section.heading}>
                            {si > 0 && <div style={{ height: 1, background: "var(--color-third)", margin: "4px 10px" }} />}
                            {/* Section label */}
                            <p style={{ margin: 0, padding: "6px 12px 2px", fontSize: "8pt", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-foreground-light)", opacity: 0.6 }}>
                                {section.heading}
                            </p>
                            {/* Items */}
                            {section.items.map(({ view, label }) => {
                                const active = view === currentView;
                                return (
                                    <button key={view} onClick={() => handlePick(view)}
                                        style={{
                                            display: "flex", alignItems: "center", gap: 10,
                                            width: "calc(100% - 8px)", margin: "0 4px",
                                            padding: "5px 8px", borderRadius: 8,
                                            background: active ? "color-mix(in srgb, var(--color-accent) 12%, transparent)" : "transparent",
                                            border: active ? "1px solid color-mix(in srgb, var(--color-accent) 35%, transparent)" : "1px solid transparent",
                                            cursor: "pointer", textAlign: "left", boxSizing: "border-box",
                                            transition: "background 100ms",
                                        }}
                                        onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--color-primary-dark)"; }}
                                        onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
                                    >
                                        {/* Icon box */}
                                        <div style={{
                                            width: 32, height: 32, flexShrink: 0,
                                            borderRadius: 8,
                                            background: active ? "color-mix(in srgb, var(--color-accent) 18%, var(--color-primary-dark))" : "var(--color-primary-dark)",
                                            border: `1px solid ${active ? "color-mix(in srgb, var(--color-accent) 40%, transparent)" : "var(--color-third)"}`,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            color: active ? "var(--color-accent)" : "var(--color-foreground-light)",
                                            transition: "background 100ms, border-color 100ms, color 100ms",
                                        }}>
                                            {VIEW_ICONS[view]}
                                        </div>
                                        {/* Label */}
                                        <span style={{ fontSize: "9.5pt", fontWeight: active ? 600 : 400, color: active ? "var(--color-accent)" : "var(--color-foreground)" }}>
                                            {label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>,
                document.body
            )}
        </>
    );
}
