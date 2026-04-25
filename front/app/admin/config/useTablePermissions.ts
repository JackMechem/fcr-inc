"use client";

import { useUserDashboardStore } from "@/stores/userDashboardStore";
import { useTableConfigStore } from "./tableConfigStore";
import type { TableKey } from "./tablePermissions-types";

export type { TableKey };

export interface TablePermissions {
    isAdmin: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canAddRow: boolean;
    lockedCols: string[];
    permanentlyLockedCols: string[];
}

const FALLBACK: Omit<TablePermissions, "isAdmin"> = {
    canEdit: false,
    canDelete: false,
    canAddRow: false,
    lockedCols: [],
    permanentlyLockedCols: [],
};

export function useTablePermissions(tableKey: TableKey): TablePermissions {
    const { role } = useUserDashboardStore();
    const config = useTableConfigStore((s) => s.config);
    const isAdmin = role === "ADMIN";
    const roleKey = isAdmin ? "admin" : "staff";
    const entry = config[tableKey] as unknown as Record<string, typeof FALLBACK> | undefined;
    const perms = entry?.[roleKey] ?? FALLBACK;
    return { isAdmin, ...perms };
}
