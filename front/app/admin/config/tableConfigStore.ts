"use client";

import { create } from "zustand";
import defaultConfig from "./tablePermissions.json";

export interface RolePerms {
    canEdit: boolean;
    canDelete: boolean;
    canAddRow: boolean;
    lockedCols: string[];
    permanentlyLockedCols: string[];
}

export interface TableEntry {
    admin: RolePerms;
    staff: RolePerms;
}

export type FullTableConfig = Record<string, TableEntry>;

interface TableConfigStore {
    config: FullTableConfig;
    loading: boolean;
    saving: string | null; // table key currently being saved
    fetchConfig: () => Promise<void>;
    updateTable: (table: string, patch: Partial<{ admin: Partial<RolePerms>; staff: Partial<RolePerms> }>) => Promise<void>;
}

export const useTableConfigStore = create<TableConfigStore>()((set, get) => ({
    config: defaultConfig as FullTableConfig,
    loading: false,
    saving: null,

    fetchConfig: async () => {
        if (get().loading) return;
        set({ loading: true });
        try {
            const res = await fetch("/api/table-config");
            if (res.ok) {
                const data: FullTableConfig = await res.json();
                set({ config: data });
            }
        } catch {
            // silently fall back to default config
        } finally {
            set({ loading: false });
        }
    },

    updateTable: async (table, patch) => {
        set({ saving: table });
        try {
            const res = await fetch(`/api/table-config/${table}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(patch),
            });
            if (!res.ok) throw new Error(await res.text());
            const updated: TableEntry = await res.json();
            set((s) => ({ config: { ...s.config, [table]: updated } }));
        } finally {
            set({ saving: null });
        }
    },
}));
