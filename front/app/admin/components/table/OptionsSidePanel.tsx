"use client";

import React, { useRef, useEffect } from "react";
import { BiX } from "react-icons/bi";
import styles from "./spreadsheetTable.module.css";

export interface PanelTab {
    key: string;
    label: string;
    icon?: React.ReactNode;
    content: React.ReactNode;
    badge?: number;
}

interface Props {
    tabs: PanelTab[];
    activeTab: string;
    onTabChange: (key: string) => void;
    width: number;
    onWidthChange: (w: number) => void;
    onClose: () => void;
}

export default function OptionsSidePanel({ tabs, activeTab, onTabChange, width, onWidthChange, onClose }: Props) {
    const resizeStartX = useRef<number | null>(null);
    const resizeStartW = useRef(width);

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            if (resizeStartX.current === null) return;
            const dx = resizeStartX.current - e.clientX;
            onWidthChange(Math.max(220, Math.min(560, resizeStartW.current + dx)));
        };
        const onUp = () => { resizeStartX.current = null; };
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
        return () => {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
        };
    }, [onWidthChange]);

    return (
        <>
            <div
                className={styles.panelResizeHandle}
                onMouseDown={(e) => {
                    resizeStartX.current = e.clientX;
                    resizeStartW.current = width;
                    e.preventDefault();
                }}
            />
            <div
                className={styles.filterSidePanel}
                style={{ width, minWidth: width, maxWidth: width, display: "flex", flexDirection: "column" }}
            >
                {/* ── Tab bar ───────────────────────────────────────────────── */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    borderBottom: "1px solid var(--color-third)",
                    padding: "0 2px",
                    flexShrink: 0,
                    gap: 0,
                }}>
                    {tabs.map((tab) => {
                        const active = tab.key === activeTab;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => onTabChange(tab.key)}
                                title={tab.label}
                                style={{
                                    position: "relative",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: "10px 8px 8px",
                                    background: "transparent",
                                    border: "none",
                                    borderBottom: `2px solid ${active ? "var(--color-accent)" : "transparent"}`,
                                    color: active ? "var(--color-foreground)" : "var(--color-foreground-light)",
                                    fontSize: "15px",
                                    cursor: "pointer",
                                    marginBottom: "-1px",
                                    transition: "color 120ms, border-color 120ms",
                                    flexShrink: 0,
                                }}
                            >
                                {tab.icon ?? tab.label}
                                {!!tab.badge && (
                                    <span style={{
                                        position: "absolute",
                                        top: 4,
                                        right: 2,
                                        background: "var(--color-accent)",
                                        color: "white",
                                        borderRadius: 9999,
                                        fontSize: "6pt",
                                        fontWeight: 700,
                                        padding: "1px 4px",
                                        lineHeight: 1.4,
                                        pointerEvents: "none",
                                    }}>
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                    <div style={{ flex: 1 }} />
                    <button
                        className={styles.btnIcon}
                        onClick={onClose}
                        title="Close"
                        style={{ flexShrink: 0 }}
                    >
                        <BiX />
                    </button>
                </div>

                {/* ── Tab content (all mounted, active shown via display) ─── */}
                <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden" }}>
                    {tabs.map((tab) => (
                        <div
                            key={tab.key}
                            style={{
                                display: tab.key === activeTab ? "flex" : "none",
                                flexDirection: "column",
                                padding: "16px 14px",
                                gap: 4,
                                minHeight: "100%",
                                boxSizing: "border-box",
                            }}
                        >
                            {tab.content}
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
