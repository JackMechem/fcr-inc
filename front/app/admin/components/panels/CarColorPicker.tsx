"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import tableStyles from "@/app/admin/components/table/spreadsheetTable.module.css";
import s from "./PopularityPanel.module.css";

export const PICKER_SWATCHES = [
    "#f87171", "#60a5fa", "#34d399", "#fbbf24", "#a78bfa",
    "#f472b6", "#22d3ee", "#a3e635", "#fb923c", "#818cf8",
    "#2dd4bf", "#e879f9", "#facc15", "#4ade80", "#38bdf8",
    "#f43f5e", "#c084fc", "#fb7185", "#86efac", "#93c5fd",
    "#fda4af", "#6ee7b7",
    "#ffffff", "#94a3b8", "#475569", "#1e293b",
    "#ef4444", "#f97316", "#22c55e", "#3b82f6", "#8b5cf6",
];

interface CarColorPickerProps {
    color: string;
    defaultColor: string;
    top: number;
    left: number;
    onChange: (color: string) => void;
    onClose: () => void;
}

export default function CarColorPicker({ color, defaultColor, top, left, onChange, onClose }: CarColorPickerProps) {
    const menuRef    = useRef<HTMLDivElement>(null);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    const [hexVal, setHexVal] = useState(color);
    useEffect(() => { setHexVal(color); }, [color]);

    // Click-outside to close (deferred so the opening click doesn't immediately close)
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (!menuRef.current?.contains(e.target as Node)) onCloseRef.current();
        };
        const id = setTimeout(() => document.addEventListener("mousedown", handler), 0);
        return () => { clearTimeout(id); document.removeEventListener("mousedown", handler); };
    }, []);

    if (typeof document === "undefined") return null;

    // Keep popup on-screen
    const W = 216, H = 230;
    const adjTop  = Math.min(top,  (typeof window !== "undefined" ? window.innerHeight : 800) - H - 8);
    const adjLeft = Math.min(left, (typeof window !== "undefined" ? window.innerWidth  : 1200) - W - 8);

    return createPortal(
        <div
            ref={menuRef}
            className={tableStyles.contextMenu}
            style={{ top: Math.max(8, adjTop), left: Math.max(8, adjLeft), padding: "6px 0 8px", width: W }}
        >
            <p className={tableStyles.ctxSection}>Color</p>

            <div className={s.colorSwatchGrid}>
                {PICKER_SWATCHES.map((c) => (
                    <button
                        key={c}
                        className={`${s.colorSwatch} ${c.toLowerCase() === color.toLowerCase() ? s.colorSwatchActive : ""}`}
                        style={{ background: c }}
                        onClick={() => { onChange(c); onClose(); }}
                        title={c}
                    />
                ))}
            </div>

            <div className={tableStyles.ctxDivider} />

            <div className={s.colorPickerRow}>
                <span className={s.colorPickerPreview} style={{ background: color }} />
                <input
                    type="text"
                    className={s.colorPickerHexInput}
                    value={hexVal}
                    onChange={(e) => {
                        const v = e.target.value;
                        setHexVal(v);
                        if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v);
                    }}
                    spellCheck={false}
                    maxLength={7}
                    placeholder="#000000"
                />
                {color.toLowerCase() !== defaultColor.toLowerCase() && (
                    <button className={s.colorPickerAutoBtn} onClick={() => { onChange(defaultColor); onClose(); }}>
                        Auto
                    </button>
                )}
            </div>
        </div>,
        document.body
    );
}
