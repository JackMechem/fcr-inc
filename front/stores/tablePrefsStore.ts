import { create } from "zustand";
import { persist } from "zustand/middleware";

// Serialisable filter entry — structurally compatible with ActiveFilter from FilterPanel
export interface StoredFilter {
    id: string;
    field: string;
    label: string;
    type: string;
    operator: string;
    value: string;
    options?: string[];
}

interface TablePrefsStore {
    // All maps are keyed by table title
    visibleCols: Record<string, string[]>;
    colWidths: Record<string, Record<string, number>>;
    colOrder: Record<string, string[]>;
    lockedCols: Record<string, string[]>;
    tableFilters: Record<string, StoredFilter[]>;

    setVisibleCols: (title: string, cols: string[]) => void;
    setColWidths: (title: string, widths: Record<string, number>) => void;
    setColOrder: (title: string, order: string[]) => void;
    setLockedCols: (title: string, cols: string[]) => void;
    setTableFilters: (title: string, filters: StoredFilter[]) => void;
}

export const useTablePrefsStore = create<TablePrefsStore>()(
    persist(
        (set) => ({
            visibleCols: {},
            colWidths: {},
            colOrder: {},
            lockedCols: {},
            tableFilters: {},
            setVisibleCols: (title, cols) =>
                set((s) => ({ visibleCols: { ...s.visibleCols, [title]: cols } })),
            setColWidths: (title, widths) =>
                set((s) => ({ colWidths: { ...s.colWidths, [title]: widths } })),
            setColOrder: (title, order) =>
                set((s) => ({ colOrder: { ...s.colOrder, [title]: order } })),
            setLockedCols: (title, cols) =>
                set((s) => ({ lockedCols: { ...s.lockedCols, [title]: cols } })),
            setTableFilters: (title, filters) =>
                set((s) => ({ tableFilters: { ...s.tableFilters, [title]: filters } })),
        }),
        { name: "fcr-table-prefs" },
    ),
);
