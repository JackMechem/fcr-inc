"use client";

import { useState, useEffect, useCallback } from "react";
import { Account, AccountRole } from "@/app/lib/fcr-client";
import { getAccounts, createAccount, deleteAccount, updateAccount } from "../../actions";
import SpreadsheetTable, { Column, RowEdit } from "../table/SpreadsheetTable";
import { useTablePermissions } from "../../config/useTablePermissions";
import { ActiveFilter, FilterableColumn, filtersToRecord } from "../table/FilterPanel";
import { useTablePrefsStore } from "@/stores/tablePrefsStore";
import { useUserDashboardStore } from "@/stores/userDashboardStore";
import { setPendingJump } from "../../config/pendingJump";

const TABLE_TITLE = "Accounts Database";
const EMPTY_FILTERS: ActiveFilter[] = [];

const FILTERABLE_COLUMNS: FilterableColumn[] = [
    { field: "search", label: "Name / Email", type: "text" },
    { field: "role",   label: "Role", type: "select", options: ["ADMIN", "STAFF", "USER"] },
];
import styles from "../table/spreadsheetTable.module.css";
import { BiSave, BiX, BiRefresh } from "react-icons/bi";

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (val: string | number | null) => {
    if (!val) return "—";
    const ms = typeof val === "number" ? val * 1000 : new Date(val).getTime();
    return new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const RoleBadge = ({ role }: { role: AccountRole }) => {
    const color =
        role === "ADMIN"
            ? { bg: "rgba(239,68,68,0.12)", color: "#ef4444" }
            : role === "STAFF"
            ? { bg: "rgba(59,130,246,0.12)", color: "#3b82f6" }
            : { bg: "var(--color-third)", color: "var(--color-foreground-light)" };
    return (
        <span
            className={styles.statusBadge}
            style={{ backgroundColor: color.bg, color: color.color }}
        >
            {role}
        </span>
    );
};

// ── Column definitions ───────────────────────────────────────────────────────

const ACCOUNT_COLUMNS: Column<Account>[] = [
    { key: "acctId",             label: "ID",             defaultVisible: true,  locked: true,  render: (a) => `#${a.acctId}` },
    { key: "name",               label: "Name",           defaultVisible: true,  render: (a) => a.name,  minWidth: 140, editable: true, editType: "text", getValue: (a) => a.name },
    { key: "email",              label: "Email",          defaultVisible: true,  render: (a) => a.email, minWidth: 180, editable: true, editType: "text", getValue: (a) => a.email },
    { key: "role",               label: "Role",           defaultVisible: true,  render: (a) => <RoleBadge role={a.role} />, editable: true, editType: "select", editOptions: ["CUSTOMER", "STAFF", "ADMIN"], getValue: (a) => a.role },
    { key: "dateCreated",        label: "Created",        defaultVisible: true,  render: (a) => fmtDate(a.dateCreated) },
    { key: "dateEmailConfirmed", label: "Email Confirmed",defaultVisible: false, render: (a) => fmtDate(a.dateEmailConfirmed) },
    { key: "user",               label: "Linked User",    defaultVisible: false, render: (a) => a.user != null ? `#${a.user}` : "—", editable: true, editType: "number", getValue: (a) => a.user ?? "",
        references: { view: "view-users", label: "User", getSearchTerm: (a) => a.user != null ? String(a.user) : null } },
    { key: "bookmarkedCars",     label: "Bookmarks",      defaultVisible: false, render: (a) => a.bookmarkedCars?.length ?? 0 },
];

// ── Edit Form ────────────────────────────────────────────────────────────────

interface EditFormProps {
    account: Account;
    canChangeRole: boolean;
    onSave: (patch: Partial<Pick<Account, "name" | "email" | "role">>) => Promise<void>;
    onCancel: () => void;
}

const EditForm = ({ account, canChangeRole, onSave, onCancel }: EditFormProps) => {
    const [name, setName] = useState(account.name);
    const [email, setEmail] = useState(account.email);
    const [role, setRole] = useState<AccountRole>(account.role);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const patch: Partial<Pick<Account, "name" | "email" | "role">> = {};
            if (name !== account.name) patch.name = name;
            if (email !== account.email) patch.email = email;
            if (role !== account.role) patch.role = role;
            await onSave(patch);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={styles.editArea}>
            <div className={styles.editAreaHeader}>
                <span className={styles.editAreaTitle}>Edit Account #{account.acctId}</span>
                <button className={styles.actionBtn} onClick={onCancel} style={{ opacity: 0.6 }}><BiX /></button>
            </div>
            <div className={styles.editGrid}>
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Name</label>
                    <input className={styles.fieldInput} value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Email</label>
                    <input className={styles.fieldInput} value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                {canChangeRole && (
                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>Role</label>
                        <select className={styles.fieldInput} value={role} onChange={(e) => setRole(e.target.value as AccountRole)}>
                            <option value="CUSTOMER">CUSTOMER</option>
                            <option value="STAFF">STAFF</option>
                            <option value="ADMIN">ADMIN</option>
                        </select>
                    </div>
                )}
            </div>
            <div className={styles.formActions}>
                <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={handleSave} disabled={saving}>
                    {saving ? <BiRefresh className={styles.spinning} /> : <BiSave />}
                </button>
                <button className={styles.actionBtn} onClick={onCancel} style={{ opacity: 0.6 }}><BiX /></button>
            </div>
        </div>
    );
};

// ── Panel ────────────────────────────────────────────────────────────────────

const UsersPanel = () => {
    const { isAdmin, canEdit, canDelete, canAddRow, lockedCols, permanentlyLockedCols } = useTablePermissions("accounts");

    const [accounts, setAccounts] = useState<Account[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<Set<string | number>>(new Set());
    const [bulkDeleting, setBulkDeleting] = useState(false);
    const [editing, setEditing] = useState<Account | null>(null);
    const [sortBy, setSortBy] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
    const storedFilters = useTablePrefsStore((s) => s.tableFilters[TABLE_TITLE]);
    const storeSetFilters = useTablePrefsStore((s) => s.setTableFilters);
    const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>((storedFilters ?? EMPTY_FILTERS) as ActiveFilter[]);
    const handleFiltersChange = (f: ActiveFilter[]) => { setActiveFilters(f); storeSetFilters(TABLE_TITLE, f); };

    const fetchPage = useCallback(async (p: number, ps: number, sb: string | null, sd: "asc" | "desc", filters: ActiveFilter[] = [], isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(p), pageSize: String(ps) });
            if (sb) { params.set("sortBy", sb); params.set("sortDir", sd); }
            Object.entries(filtersToRecord(filters)).forEach(([k, v]) => { if (v !== undefined) params.set(k, String(v)); });
            const res = await fetch(`/api/accounts?${params}`, { cache: "no-store" });
            if (!res.ok) throw new Error(`${res.status}`);
            const data = await res.json();
            setAccounts(data?.data ?? []);
            setTotalPages(data?.totalPages ?? 1);
            setTotalItems(data?.totalItems ?? 0);
        } catch (e) {
            alert("Failed to fetch accounts: " + e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchPage(page, pageSize, sortBy, sortDir, activeFilters); }, [page, pageSize, fetchPage]);
    useEffect(() => { setPage(1); fetchPage(1, pageSize, sortBy, sortDir, activeFilters); }, [activeFilters]);

    const handlePageChange = (p: number) => { setPage(p); setSelected(new Set()); };
    const handlePageSizeChange = (ps: number) => { setPageSize(ps); setPage(1); setSelected(new Set()); };
    const handleRefresh = () => fetchPage(page, pageSize, sortBy, sortDir, activeFilters, true);

    const handleSortChange = (col: string, dir: "asc" | "desc") => {
        setSortBy(col); setSortDir(dir); setPage(1);
        fetchPage(1, pageSize, col, dir, activeFilters);
    };

    const handleBulkDelete = async () => {
        const ids = [...selected] as number[];
        if (!window.confirm(`Delete ${ids.length} account${ids.length !== 1 ? "s" : ""}? This cannot be undone.`)) return;
        setBulkDeleting(true);
        const results = await Promise.allSettled(ids.map((id) => deleteAccount(id)));
        const failed = ids.filter((_, i) => results[i].status === "rejected");
        setBulkDeleting(false);
        if (failed.length) alert(`${failed.length} deletion(s) failed.`);
        setSelected(new Set(failed));
        fetchPage(page, pageSize, sortBy, sortDir, activeFilters, true);
    };

    const handleEdit = (account: Account) => setEditing(account);

    const handleDeleteOne = async (account: Account) => {
        if (!window.confirm(`Delete account #${account.acctId}? This cannot be undone.`)) return;
        try {
            await deleteAccount(account.acctId);
            fetchPage(page, pageSize, sortBy, sortDir, activeFilters, true);
        } catch (e) {
            alert("Delete failed: " + e);
        }
    };

    const handleCreateRow = async (data: Record<string, string | string[]>) => {
        await createAccount({
            name:  String(data.name ?? ""),
            email: String(data.email ?? ""),
            role:  String(data.role ?? "CUSTOMER"),
        });
        fetchPage(page, pageSize, sortBy, sortDir, activeFilters, true);
    };

    const handleSaveEdit = async (patch: Partial<Pick<Account, "name" | "email" | "role">>) => {
        if (!editing) return;
        await updateAccount(editing.acctId, patch);
        setEditing(null);
        fetchPage(page, pageSize, sortBy, sortDir, activeFilters, true);
    };

    const handleSaveEdits = async (edits: RowEdit<Account>[]) => {
        await Promise.all(edits.map(({ id, patch }) =>
            updateAccount(id as number, patch as Partial<Pick<Account, "name" | "email" | "role">>)
        ));
        fetchPage(page, pageSize, sortBy, sortDir, activeFilters, true);
    };

    const filtered = query
        ? accounts.filter((a) =>
              `${a.name} ${a.email} ${a.acctId} ${a.role}`.toLowerCase().includes(query.toLowerCase()),
          )
        : accounts;

    return (
        <>
            <SpreadsheetTable<Account>
                columns={ACCOUNT_COLUMNS}
                data={filtered}
                getRowId={(a) => a.acctId}
                page={page}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                loading={loading}
                refreshing={refreshing}
                isAdmin={isAdmin}
                selected={selected}
                onSelectionChange={setSelected}
                onBulkDelete={canDelete ? handleBulkDelete : undefined}
                bulkDeleting={bulkDeleting}
                onEdit={handleEdit}
                onDeleteOne={canDelete ? handleDeleteOne : undefined}
                onRefresh={handleRefresh}
                filterableColumns={FILTERABLE_COLUMNS}
                activeFilters={activeFilters}
                onFiltersChange={handleFiltersChange}
                title="Accounts Database"
                subtitle={query ? `${filtered.length} matching on this page` : undefined}
                searchQuery={query}
                onSearchChange={setQuery}
                searchPlaceholder="Filter by name, email, ID or role\u2026"
                emptyMessage="No accounts found."
                onSaveEdits={canEdit ? handleSaveEdits : undefined}
                onCreateRow={canAddRow ? handleCreateRow : undefined}
                initialLockedCols={lockedCols}
                permanentlyLockedCols={permanentlyLockedCols}
                sortBy={sortBy}
                sortDir={sortDir}
                onSortChange={handleSortChange}
                onGoToReference={(view, search) => {
                    setPendingJump(view, search);
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    useUserDashboardStore.getState().setActiveView(view as any);
                }}
            />
            {editing && (
                <EditForm
                    account={editing}
                    canChangeRole={isAdmin}
                    onSave={handleSaveEdit}
                    onCancel={() => setEditing(null)}
                />
            )}
        </>
    );
};

export default UsersPanel;
