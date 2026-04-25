"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
    BiText, BiHash, BiCalendar, BiListUl, BiToggleLeft,
    BiSearch, BiX, BiChevronLeft,
} from "react-icons/bi";
import styles from "./spreadsheetTable.module.css";

// ── Types ─────────────────────────────────────────────────────────────────────

export type FilterFieldType = "text" | "number" | "date" | "select" | "boolean";

export interface FilterableColumn {
    field: string;
    label: string;
    type: FilterFieldType;
    options?: string[];
}

export interface ActiveFilter {
    id: string;
    field: string;
    label: string;
    type: FilterFieldType;
    operator: string;
    value: string;
    options?: string[];
}

// ── Operators ─────────────────────────────────────────────────────────────────

export const FILTER_OPERATORS: Record<FilterFieldType, { value: string; label: string }[]> = {
    text: [
        { value: "contains",     label: "contains" },
        { value: "equals",       label: "equals" },
        { value: "starts_with",  label: "starts with" },
        { value: "is_empty",     label: "is empty" },
        { value: "is_not_empty", label: "is not empty" },
    ],
    number: [
        { value: "equals", label: "=" },
        { value: "gt",     label: ">" },
        { value: "gte",    label: "≥" },
        { value: "lt",     label: "<" },
        { value: "lte",    label: "≤" },
    ],
    date: [
        { value: "equals", label: "is" },
        { value: "before", label: "before" },
        { value: "after",  label: "after" },
    ],
    select: [
        { value: "equals",       label: "is" },
        { value: "not_equals",   label: "is not" },
        { value: "is_empty",     label: "is empty" },
        { value: "is_not_empty", label: "is not empty" },
    ],
    boolean: [
        { value: "is_true",  label: "is true" },
        { value: "is_false", label: "is false" },
    ],
};

const TYPE_ICONS: Record<FilterFieldType, React.ReactNode> = {
    text:    <BiText size={13} />,
    number:  <BiHash size={13} />,
    date:    <BiCalendar size={13} />,
    select:  <BiListUl size={13} />,
    boolean: <BiToggleLeft size={13} />,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

export function operatorNeedsValue(op: string): boolean {
    return !["is_empty", "is_not_empty", "is_true", "is_false"].includes(op);
}

export function formatFilterLabel(f: ActiveFilter): string {
    const op = FILTER_OPERATORS[f.type]?.find((o) => o.value === f.operator)?.label ?? f.operator;
    if (!operatorNeedsValue(f.operator)) return `${f.label} ${op}`;
    return `${f.label} ${op} ${f.value}`;
}

/** Convert active filters to a flat record of query params. */
export function filtersToRecord(filters: ActiveFilter[]): Record<string, string | number | undefined> {
    const result: Record<string, string | number | undefined> = {};
    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    for (const f of filters) {
        if (operatorNeedsValue(f.operator) && !f.value.trim()) continue;
        switch (f.operator) {
            case "equals":
            case "contains":
            case "starts_with":
                result[f.field] = f.value;
                break;
            case "not_equals":
                result[`${f.field}Not`] = f.value;
                break;
            case "gt":
            case "gte":
                result[`min${cap(f.field)}`] = f.value;
                break;
            case "lt":
            case "lte":
                result[`max${cap(f.field)}`] = f.value;
                break;
            case "before":
                result[`${f.field}Before`] = f.value;
                break;
            case "after":
                result[`${f.field}After`] = f.value;
                break;
            case "is_true":
                result[f.field] = "true";
                break;
            case "is_false":
                result[f.field] = "false";
                break;
        }
    }
    return result;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface FilterPanelProps {
    filterableColumns: FilterableColumn[];
    activeFilters: ActiveFilter[];
    onAdd: (filter: ActiveFilter) => void;
    onRemove: (id: string) => void;
    onUpdate: (filter: ActiveFilter) => void;
    onClose: () => void;
    pos: { top: number; right: number };
    initialEditId?: string | null;
}

export default function FilterPanel({
    filterableColumns,
    activeFilters,
    onAdd,
    onRemove,
    onUpdate,
    onClose,
    pos,
    initialEditId,
}: FilterPanelProps) {
    const [view, setView] = useState<"list" | "edit">(initialEditId ? "edit" : "list");
    const [colSearch, setColSearch] = useState("");
    const [editing, setEditing] = useState<ActiveFilter | null>(() =>
        initialEditId ? (activeFilters.find((f) => f.id === initialEditId) ?? null) : null
    );
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (!panelRef.current?.contains(e.target as Node)) onClose();
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [onClose]);

    const filteredCols = filterableColumns.filter((c) =>
        c.label.toLowerCase().includes(colSearch.toLowerCase())
    );

    const selectColumn = (col: FilterableColumn) => {
        const defaultOp = FILTER_OPERATORS[col.type][0].value;
        setEditing({
            id: Math.random().toString(36).slice(2),
            field: col.field,
            label: col.label,
            type: col.type,
            operator: defaultOp,
            value: col.options?.[0] ?? "",
            options: col.options,
        });
        setView("edit");
    };

    const handleConfirm = () => {
        if (!editing) return;
        const isExisting = activeFilters.some((f) => f.id === editing.id);
        if (isExisting) onUpdate(editing); else onAdd(editing);
        setView("list");
        setEditing(null);
        setColSearch("");
    };

    const handleBack = () => { setView("list"); setEditing(null); };

    const applyDisabled = operatorNeedsValue(editing?.operator ?? "") && !editing?.value.trim();

    return createPortal(
        <div
            ref={panelRef}
            className={styles.contextMenu}
            style={{ top: pos.top, right: pos.right, left: "auto", width: 260, overflow: "hidden", padding: 0 }}
        >
            {/* ── Header ─────────────────────────────────────────────── */}
            <div style={{
                display: "flex", alignItems: "center", gap: 2,
                padding: "4px 6px 4px 10px",
                borderBottom: "1px solid var(--color-third)",
            }}>
                {view === "edit" && (
                    <button
                        onClick={handleBack}
                        className={styles.colMenuActionBtn}
                        style={{ padding: "3px 5px", flexShrink: 0 }}
                    >
                        <BiChevronLeft size={14} />
                    </button>
                )}
                <span className={styles.ctxSection} style={{ flex: 1, padding: "4px 2px", opacity: 1 }}>
                    {view === "list" ? "Filter" : editing?.label}
                </span>
                <button
                    onClick={onClose}
                    className={styles.colMenuActionBtn}
                    style={{ padding: "3px 5px", flexShrink: 0 }}
                >
                    <BiX size={14} />
                </button>
            </div>

            {view === "list" ? (
                <>
                    {/* ── Search ────────────────────────────────────── */}
                    <div style={{ padding: "6px 8px", borderBottom: "1px solid var(--color-third)" }}>
                        <div style={{
                            display: "flex", alignItems: "center", gap: 6,
                            padding: "4px 8px", borderRadius: 6,
                            background: "var(--color-primary-dark)",
                            border: "1px solid var(--color-third)",
                        }}>
                            <BiSearch size={12} style={{ color: "var(--color-foreground-light)", flexShrink: 0 }} />
                            <input
                                autoFocus
                                value={colSearch}
                                onChange={(e) => setColSearch(e.target.value)}
                                placeholder="Filter by…"
                                style={{
                                    background: "none", border: "none", outline: "none",
                                    fontSize: 12, color: "var(--color-foreground)",
                                    width: "100%", padding: 0,
                                }}
                            />
                        </div>
                    </div>

                    {/* ── Column list ────────────────────────────────── */}
                    <div style={{ maxHeight: 220, overflowY: "auto", padding: "4px 0" }}>
                        {filteredCols.map((col) => (
                            <button
                                key={col.field}
                                className={styles.ctxItem}
                                onClick={() => selectColumn(col)}
                            >
                                <span style={{ color: "var(--color-foreground-light)", display: "flex", flexShrink: 0 }}>
                                    {TYPE_ICONS[col.type]}
                                </span>
                                {col.label}
                            </button>
                        ))}
                        {filteredCols.length === 0 && (
                            <span className={styles.ctxEmpty}>No fields match.</span>
                        )}
                    </div>

                    {/* ── Active filters ─────────────────────────────── */}
                    {activeFilters.length > 0 && (
                        <>
                            <div className={styles.ctxDivider} />
                            <div className={styles.ctxSection}>Active</div>
                            <div style={{ padding: "2px 0 4px" }}>
                                {activeFilters.map((f) => (
                                    <div key={f.id} style={{ display: "flex", alignItems: "center", padding: "0 4px" }}>
                                        <button
                                            className={`${styles.ctxItem} ${styles.ctxItemActive}`}
                                            style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                                            onClick={() => { setEditing(f); setView("edit"); }}
                                        >
                                            {formatFilterLabel(f)}
                                        </button>
                                        <button
                                            onClick={() => onRemove(f.id)}
                                            className={styles.colMenuActionBtn}
                                            style={{ padding: "3px 5px", flexShrink: 0 }}
                                            title="Remove filter"
                                        >
                                            <BiX size={13} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </>
            ) : editing ? (
                <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
                    {/* ── Operator ───────────────────────────────────── */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span className={styles.ctxSection} style={{ padding: 0, opacity: 1 }}>Condition</span>
                        <select
                            className={styles.fieldInput}
                            value={editing.operator}
                            onChange={(e) => setEditing({ ...editing, operator: e.target.value, value: editing.options?.[0] ?? "" })}
                        >
                            {FILTER_OPERATORS[editing.type].map((op) => (
                                <option key={op.value} value={op.value}>{op.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* ── Value ──────────────────────────────────────── */}
                    {operatorNeedsValue(editing.operator) && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <span className={styles.ctxSection} style={{ padding: 0, opacity: 1 }}>Value</span>
                            {editing.type === "select" && editing.options ? (
                                <select
                                    className={styles.fieldInput}
                                    value={editing.value}
                                    onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                                >
                                    {editing.options.map((opt) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    autoFocus
                                    className={styles.fieldInput}
                                    type={editing.type === "number" ? "number" : editing.type === "date" ? "date" : "text"}
                                    value={editing.value}
                                    onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                                    placeholder="Enter value…"
                                    onKeyDown={(e) => { if (e.key === "Enter") handleConfirm(); if (e.key === "Escape") handleBack(); }}
                                />
                            )}
                        </div>
                    )}

                    {/* ── Actions ────────────────────────────────────── */}
                    <div style={{ display: "flex", gap: 6, paddingTop: 2 }}>
                        {activeFilters.some((f) => f.id === editing.id) && (
                            <button
                                className={styles.colMenuActionBtn}
                                onClick={() => { onRemove(editing.id); handleBack(); }}
                                style={{ flex: 1, padding: "5px 0", justifyContent: "center" }}
                            >
                                Remove
                            </button>
                        )}
                        <button
                            onClick={handleConfirm}
                            disabled={applyDisabled}
                            style={{
                                flex: 2, padding: "5px 0", borderRadius: 6,
                                fontSize: 12, fontWeight: 600,
                                border: "none",
                                background: applyDisabled ? "var(--color-third)" : "var(--color-accent)",
                                color: applyDisabled ? "var(--color-foreground-light)" : "var(--color-primary)",
                                cursor: applyDisabled ? "not-allowed" : "pointer",
                            }}
                        >
                            Apply
                        </button>
                    </div>
                </div>
            ) : null}
        </div>,
        document.body
    );
}
