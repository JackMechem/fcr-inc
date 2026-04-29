"use client";

import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { BiPlus, BiX, BiEdit } from "react-icons/bi";
import { usePaneTabStore } from "@/stores/paneTabStore";
import { useUserDashboardStore } from "@/stores/userDashboardStore";

export default function TabBar() {
    const { tabs, activeTabId, addTab, removeTab, setActiveTab, renameTab } = usePaneTabStore();
    const activeView = useUserDashboardStore((s) => s.activeView);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const [ctxMenu, setCtxMenu] = useState<{ tabId: string; x: number; y: number } | null>(null);
    const ctxRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (editingId) inputRef.current?.select();
    }, [editingId]);

    useEffect(() => {
        if (!ctxMenu) return;
        const handler = (e: MouseEvent) => {
            if (!ctxRef.current?.contains(e.target as Node)) setCtxMenu(null);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [ctxMenu]);

    const startEdit = (id: string, name: string) => {
        setCtxMenu(null);
        setEditingId(id);
        setEditValue(name);
    };

    const commitEdit = () => {
        if (editingId) renameTab(editingId, editValue.trim() || "Tab");
        setEditingId(null);
    };

    const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
        e.preventDefault();
        setCtxMenu({ tabId, x: e.clientX, y: e.clientY });
    };

    return (
        <div style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "0 10px",
            height: 36,
            flexShrink: 0,
            overflowX: "auto",
            overflowY: "hidden",
        }}>
            {tabs.map((tab) => {
                const isActive = tab.id === activeTabId;
                return (
                    <div
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        onDoubleClick={() => startEdit(tab.id, tab.name)}
                        onContextMenu={(e) => handleContextMenu(e, tab.id)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "8px 10px 8px 14px",
                            height: "auto",
                            borderRadius: 12,
                            border: `1px solid ${isActive ? "var(--color-accent)" : "var(--color-third)"}`,
                            background: isActive
                                ? "color-mix(in srgb, var(--color-accent) 12%, var(--color-primary))"
                                : "transparent",
                            color: isActive ? "var(--color-accent)" : "var(--color-foreground-light)",
                            cursor: "pointer",
                            userSelect: "none",
                            flexShrink: 0,
                            fontSize: "9.5pt",
                            fontWeight: isActive ? 600 : 400,
                            transition: "background 150ms, border-color 150ms, color 150ms",
                        }}
                    >
                        {editingId === tab.id ? (
                            <input
                                ref={inputRef}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={commitEdit}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") commitEdit();
                                    if (e.key === "Escape") setEditingId(null);
                                    e.stopPropagation();
                                }}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    outline: "none",
                                    color: "inherit",
                                    font: "inherit",
                                    width: Math.max(40, editValue.length * 7),
                                    padding: 0,
                                }}
                            />
                        ) : (
                            <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {tab.name}
                            </span>
                        )}

                        {tabs.length > 1 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); removeTab(tab.id); }}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: 0,
                                    width: 14,
                                    height: 14,
                                    borderRadius: 3,
                                    border: "none",
                                    background: "transparent",
                                    color: "inherit",
                                    cursor: "pointer",
                                    opacity: 0.6,
                                    flexShrink: 0,
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.6"; }}
                            >
                                <BiX size={12} />
                            </button>
                        )}
                    </div>
                );
            })}

            {/* Add tab */}
            <button
                onClick={() => addTab(activeView)}
                title="New tab"
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    border: "1px solid transparent",
                    background: "transparent",
                    color: "var(--color-foreground-light)",
                    cursor: "pointer",
                    flexShrink: 0,
                    transition: "background 120ms, border-color 120ms",
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--color-primary-dark)";
                    e.currentTarget.style.borderColor = "var(--color-third)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = "transparent";
                }}
            >
                <BiPlus size={14} />
            </button>

            {/* Context menu */}
            {ctxMenu && typeof document !== "undefined" && createPortal(
                <div
                    ref={ctxRef}
                    style={{
                        position: "fixed",
                        top: ctxMenu.y,
                        left: ctxMenu.x,
                        zIndex: 9999,
                        background: "var(--color-primary)",
                        border: "1px solid var(--color-third)",
                        borderRadius: 10,
                        padding: "4px 0",
                        minWidth: 160,
                        boxShadow: "0 8px 24px rgba(0,0,0,0.2), 0 2px 6px rgba(0,0,0,0.1)",
                    }}
                >
                    <button
                        onClick={() => {
                            const tab = tabs.find((t) => t.id === ctxMenu.tabId);
                            if (tab) startEdit(tab.id, tab.name);
                        }}
                        style={{
                            display: "flex", alignItems: "center", gap: 8,
                            width: "calc(100% - 8px)", margin: "0 4px",
                            padding: "6px 10px", fontSize: "9.5pt",
                            color: "var(--color-foreground)", background: "transparent",
                            border: "none", borderRadius: 6,
                            cursor: "pointer", textAlign: "left", boxSizing: "border-box",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-primary-dark)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                        <BiEdit size={14} /> Rename
                    </button>
                </div>,
                document.body
            )}
        </div>
    );
}
