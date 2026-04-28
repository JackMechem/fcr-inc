"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { BiX } from "react-icons/bi";
import styles from "./spreadsheetTable.module.css";
import PillSelect from "@/app/browse/components/filters/pillSelect";
import FilterBarNumberRangeInline from "@/app/browse/components/filters/filterBarNumberRangeInline";
import DatePicker from "@/app/components/DatePicker";
import { FilterableColumn, ActiveFilter } from "./FilterPanel";

// ── Internal state types ──────────────────────────────────────────────────────

type SelectState = Record<string, string[]>;
type RangeState = Record<string, { min: string; max: string }>;
type TextState = Record<string, string>;
type DateState = Record<string, { min: string; max: string }>;

function initSelectState(cols: FilterableColumn[], filters: ActiveFilter[]): SelectState {
    const state: SelectState = {};
    for (const col of cols) {
        if (col.type !== "select") continue;
        const f = filters.find((x) => x.id === `browse_${col.field}` && x.operator === "in");
        state[col.field] = f ? f.value.split(",").filter(Boolean) : [];
    }
    return state;
}

function initRangeState(cols: FilterableColumn[], filters: ActiveFilter[]): RangeState {
    const state: RangeState = {};
    for (const col of cols) {
        if (col.type !== "number" || col.min == null || col.max == null) continue;
        const minF = filters.find((x) => x.id === `browse_${col.field}_min`);
        const maxF = filters.find((x) => x.id === `browse_${col.field}_max`);
        state[col.field] = {
            min: minF ? minF.value : col.min.toString(),
            max: maxF ? maxF.value : col.max.toString(),
        };
    }
    return state;
}

function initDateState(cols: FilterableColumn[], filters: ActiveFilter[]): DateState {
    const state: DateState = {};
    for (const col of cols) {
        if (col.type !== "date") continue;
        const minF = filters.find((x) => x.id === `browse_${col.field}_min`);
        const maxF = filters.find((x) => x.id === `browse_${col.field}_max`);
        state[col.field] = { min: minF?.value ?? "", max: maxF?.value ?? "" };
    }
    return state;
}

function initTextState(cols: FilterableColumn[], filters: ActiveFilter[]): TextState {
    const state: TextState = {};
    for (const col of cols) {
        const isTextInput = col.type === "text" || (col.type === "number" && (col.min == null || col.max == null));
        if (!isTextInput) continue;
        const f = filters.find(
            (x) => x.id === `browse_${col.field}` &&
            (x.operator === "contains" || x.operator === "equals"),
        );
        state[col.field] = f ? f.value : "";
    }
    return state;
}

function stateToFilters(
    cols: FilterableColumn[],
    selectState: SelectState,
    rangeState: RangeState,
    textState: TextState,
    dateState: DateState = {},
): ActiveFilter[] {
    const out: ActiveFilter[] = [];
    for (const col of cols) {
        if (col.type === "select") {
            const vals = selectState[col.field] ?? [];
            if (vals.length > 0) {
                out.push({
                    id: `browse_${col.field}`,
                    field: col.field,
                    label: col.label,
                    type: "select",
                    operator: "in",
                    value: vals.join(","),
                    options: col.options,
                });
            }
        } else if (col.type === "number" && col.min != null && col.max != null) {
            const range = rangeState[col.field];
            if (range) {
                const isMinChanged = range.min !== col.min.toString();
                const isMaxChanged = range.max !== col.max.toString();
                if (isMinChanged) {
                    out.push({
                        id: `browse_${col.field}_min`,
                        field: col.field,
                        label: col.label,
                        type: "number",
                        operator: "gte",
                        value: range.min,
                    });
                }
                if (isMaxChanged) {
                    out.push({
                        id: `browse_${col.field}_max`,
                        field: col.field,
                        label: col.label,
                        type: "number",
                        operator: "lte",
                        value: range.max,
                    });
                }
            }
        } else if (col.type === "date") {
            const range = dateState[col.field];
            if (range?.min) {
                out.push({
                    id: `browse_${col.field}_min`,
                    field: col.field,
                    label: col.label,
                    type: "date",
                    operator: "after",
                    value: range.min,
                });
            }
            if (range?.max) {
                out.push({
                    id: `browse_${col.field}_max`,
                    field: col.field,
                    label: col.label,
                    type: "date",
                    operator: "before",
                    value: range.max,
                });
            }
        } else if (col.type === "text" || (col.type === "number" && (col.min == null || col.max == null))) {
            const text = textState[col.field]?.trim();
            if (text) {
                out.push({
                    id: `browse_${col.field}`,
                    field: col.field,
                    label: col.label,
                    type: col.type,
                    operator: col.type === "text" ? "contains" : "equals",
                    value: text,
                });
            }
        }
    }
    return out;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface BrowseFilterPanelProps {
    filterableColumns: FilterableColumn[];
    activeFilters: ActiveFilter[];
    onFiltersChange: (filters: ActiveFilter[]) => void;
    width: number;
    onWidthChange: (w: number) => void;
    onClose: () => void;
}

export default function BrowseFilterPanel({
    filterableColumns,
    activeFilters,
    onFiltersChange,
    width,
    onWidthChange,
    onClose,
}: BrowseFilterPanelProps) {
    const [selectState, setSelectState] = useState<SelectState>(
        () => initSelectState(filterableColumns, activeFilters),
    );
    const [rangeState, setRangeState] = useState<RangeState>(
        () => initRangeState(filterableColumns, activeFilters),
    );
    const [textState, setTextState] = useState<TextState>(
        () => initTextState(filterableColumns, activeFilters),
    );
    const [dateState, setDateState] = useState<DateState>(
        () => initDateState(filterableColumns, activeFilters),
    );

    const emit = useCallback(
        (sel: SelectState, rng: RangeState, txt: TextState, dt: DateState) => {
            onFiltersChange(stateToFilters(filterableColumns, sel, rng, txt, dt));
        },
        [filterableColumns, onFiltersChange],
    );

    // Keep refs so debounced callback always reads latest state
    const selectRef = useRef(selectState);
    const rangeRef = useRef(rangeState);
    const textRef = useRef(textState);
    const dateRef = useRef(dateState);
    useEffect(() => { selectRef.current = selectState; }, [selectState]);
    useEffect(() => { rangeRef.current = rangeState; }, [rangeState]);
    useEffect(() => { textRef.current = textState; }, [textState]);
    useEffect(() => { dateRef.current = dateState; }, [dateState]);

    // Debounced text emission (350 ms)
    useEffect(() => {
        const t = setTimeout(
            () => emit(selectRef.current, rangeRef.current, textRef.current, dateRef.current),
            350,
        );
        return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [textState]);

    const hasAny =
        Object.values(selectState).some((v) => v.length > 0) ||
        filterableColumns.some((col) => {
            if (col.type !== "number" || col.min == null || col.max == null) return false;
            const r = rangeState[col.field];
            return r && (r.min !== col.min.toString() || r.max !== col.max.toString());
        }) ||
        Object.values(textState).some((v) => v.trim() !== "") ||
        Object.values(dateState).some((v) => v.min || v.max);

    const handleClearAll = () => {
        const newSel: SelectState = {};
        const newRng: RangeState = {};
        const newTxt: TextState = {};
        const newDt: DateState = {};
        for (const col of filterableColumns) {
            if (col.type === "select") newSel[col.field] = [];
            else if (col.type === "number" && col.min != null && col.max != null)
                newRng[col.field] = { min: col.min.toString(), max: col.max.toString() };
            else if (col.type === "text") newTxt[col.field] = "";
            else if (col.type === "date") newDt[col.field] = { min: "", max: "" };
        }
        setSelectState(newSel);
        setRangeState(newRng);
        setTextState(newTxt);
        setDateState(newDt);
        onFiltersChange([]);
    };

    // Resize drag
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
                style={{ width, minWidth: width, maxWidth: width }}
            >
                {/* ── Header ─────────────────────────────────────────────── */}
                <div className={styles.previewPanelHeader}>
                    <span className={styles.previewPanelTitle}>Filters</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        {hasAny && (
                            <button
                                className={styles.colMenuActionBtn}
                                onClick={handleClearAll}
                                style={{ fontSize: "8pt", padding: "2px 8px" }}
                            >
                                Clear all
                            </button>
                        )}
                        <button className={styles.btnIcon} onClick={onClose} title="Close">
                            <BiX />
                        </button>
                    </div>
                </div>

                {/* ── Body ───────────────────────────────────────────────── */}
                <div className={styles.previewPanelBody}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                        {filterableColumns.map((col) => {
                            /* ── Select → pill multi-select ── */
                            if (col.type === "select" && col.options) {
                                return (
                                    <div key={col.field}>
                                        <div className={styles.filterSectionLabel}>{col.label}</div>
                                        <PillSelect
                                            options={col.options.map((o) => ({
                                                paramId: o,
                                                displayText: o,
                                            }))}
                                            selectedValues={selectState[col.field] ?? []}
                                            onChangeMulti={(vals) => {
                                                const next = { ...selectState, [col.field]: vals };
                                                setSelectState(next);
                                                emit(next, rangeState, textState, dateState);
                                            }}
                                        />
                                    </div>
                                );
                            }

                            /* ── Number with bounds → range slider ── */
                            if (col.type === "number" && col.min != null && col.max != null) {
                                const range = rangeState[col.field] ?? {
                                    min: col.min.toString(),
                                    max: col.max.toString(),
                                };
                                return (
                                    <FilterBarNumberRangeInline
                                        key={col.field}
                                        label={col.label}
                                        min={col.min}
                                        max={col.max}
                                        defaultMin={range.min}
                                        defaultMax={range.max}
                                        onChange={(min, max) => {
                                            const next = { ...rangeState, [col.field]: { min, max } };
                                            setRangeState(next);
                                            emit(selectState, next, textState, dateState);
                                        }}
                                    />
                                );
                            }

                            /* ── Date → from/to date pickers ── */
                            if (col.type === "date") {
                                const range = dateState[col.field] ?? { min: "", max: "" };
                                const minDate = range.min ? new Date(range.min) : undefined;
                                const maxDate = range.max ? new Date(range.max) : undefined;
                                const toIso = (d: Date) => d.toISOString();
                                return (
                                    <div key={col.field}>
                                        <div className={styles.filterSectionLabel}>{col.label}</div>
                                        <div style={{ display: "flex", gap: 8 }}>
                                            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                                                <div className={styles.filterSectionLabel} style={{ marginBottom: 0 }}>Min</div>
                                                <div className={styles.fieldInput} style={{ cursor: "pointer", padding: "4px 10px" }}>
                                                    <DatePicker
                                                        label="Min"
                                                        showLabel={false}
                                                        placeholder="Min date"
                                                        selected={minDate}
                                                        allowPast
                                                        portal
                                                        onSelect={(d) => {
                                                            const next = { ...dateState, [col.field]: { ...range, min: d ? toIso(d) : "" } };
                                                            setDateState(next);
                                                            emit(selectState, rangeState, textState, next);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                                                <div className={styles.filterSectionLabel} style={{ marginBottom: 0 }}>Max</div>
                                                <div className={styles.fieldInput} style={{ cursor: "pointer", padding: "4px 10px" }}>
                                                    <DatePicker
                                                        label="Max"
                                                        showLabel={false}
                                                        placeholder="Max date"
                                                        selected={maxDate}
                                                        allowPast
                                                        portal
                                                        onSelect={(d) => {
                                                            const next = { ...dateState, [col.field]: { ...range, max: d ? toIso(d) : "" } };
                                                            setDateState(next);
                                                            emit(selectState, rangeState, textState, next);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            /* ── Text or number without bounds → plain input ── */
                            if (col.type === "text" || col.type === "number") {
                                return (
                                    <div key={col.field}>
                                        <div className={styles.filterSectionLabel}>{col.label}</div>
                                        <input
                                            className={styles.fieldInput}
                                            type={col.type === "number" ? "number" : "text"}
                                            value={textState[col.field] ?? ""}
                                            onChange={(e) =>
                                                setTextState((prev) => ({ ...prev, [col.field]: e.target.value }))
                                            }
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") emit(selectState, rangeState, textState, dateState);
                                            }}
                                            placeholder={`Filter by ${col.label.toLowerCase()}…`}
                                        />
                                    </div>
                                );
                            }

                            return null;
                        })}
                    </div>
                </div>
            </div>
        </>
    );
}
