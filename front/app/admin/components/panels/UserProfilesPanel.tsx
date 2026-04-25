"use client";

import { useState, useEffect, useCallback } from "react";
import { User } from "@/app/lib/fcr-client";
import { getUsers, createUser, deleteUser, updateUser } from "../../actions";
import SpreadsheetTable, { Column, RowEdit } from "../table/SpreadsheetTable";
import { useTablePermissions } from "../../config/useTablePermissions";
import { ActiveFilter, FilterableColumn, filtersToRecord } from "../table/FilterPanel";
import { useTablePrefsStore } from "@/stores/tablePrefsStore";
import styles from "../table/spreadsheetTable.module.css";

const TABLE_TITLE = "Users Database";
const EMPTY_FILTERS: ActiveFilter[] = [];
import { BiSave, BiX, BiRefresh } from "react-icons/bi";

const FILTERABLE_COLUMNS: FilterableColumn[] = [
    { field: "firstName", label: "First Name", type: "text" },
    { field: "lastName",  label: "Last Name",  type: "text" },
    { field: "email",     label: "Email",      type: "text" },
];

// ── Helpers ──────────────────────────────────────────���───────────────────────

const fmtDate = (val: string | number | null) => {
    if (!val) return "—";
    const ms = typeof val === "number" ? val * 1000 : new Date(val).getTime();
    return new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const fmtEpoch = (seconds: number) =>
    new Date(seconds * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const toDateInput = (seconds: number): string =>
    new Date(seconds * 1000).toISOString().split("T")[0];

const toEpoch = (dateStr: string): number =>
    Math.floor(new Date(dateStr).getTime() / 1000);

const fmtAddress = (u: User) => {
    if (!u.address) return "—";
    const a = u.address;
    return `${a.buildingNumber} ${a.streetName}, ${a.city}, ${a.state} ${a.zipCode}`;
};

// ── Column definitions ──────────────��────────────────────────────────────────

const USER_COLUMNS: Column<User>[] = [
    { key: "userId",        label: "ID",           defaultVisible: true,  render: (u) => `#${u.userId}` },
    { key: "firstName",     label: "First Name",   defaultVisible: true,  render: (u) => u.firstName,      editable: true, editType: "text", getValue: (u) => u.firstName },
    { key: "lastName",      label: "Last Name",    defaultVisible: true,  render: (u) => u.lastName,       editable: true, editType: "text", getValue: (u) => u.lastName },
    { key: "email",         label: "Email",        defaultVisible: true,  render: (u) => u.email, minWidth: 180, editable: true, editType: "text", getValue: (u) => u.email },
    { key: "phoneNumber",   label: "Phone",        defaultVisible: true,  render: (u) => u.phoneNumber || "—", editable: true, editType: "text", getValue: (u) => u.phoneNumber || "" },
    { key: "dateCreated",   label: "Created",      defaultVisible: false, render: (u) => fmtDate(u.dateCreated) },
    { key: "address",       label: "Address",      defaultVisible: false, render: (u) => <span className={styles.truncatedCell}>{fmtAddress(u)}</span>, minWidth: 200 },
    { key: "dlNumber",      label: "License #",    defaultVisible: false, render: (u) => u.driversLicense?.driversLicense || "—", editable: true, editType: "text",   getValue: (u) => u.driversLicense?.driversLicense || "" },
    { key: "dlState",       label: "DL State",     defaultVisible: false, render: (u) => u.driversLicense?.state || "—",              editable: true, editType: "text",   getValue: (u) => u.driversLicense?.state || "" },
    { key: "dlExpires",     label: "DL Expires",   defaultVisible: false, render: (u) => u.driversLicense ? fmtEpoch(u.driversLicense.expirationDate) : "—", editable: true, editType: "text", getValue: (u) => u.driversLicense ? toDateInput(u.driversLicense.expirationDate) : "" },
    { key: "dob",           label: "DOB",          defaultVisible: false, render: (u) => u.driversLicense ? fmtEpoch(u.driversLicense.dateOfBirth) : "—",   editable: true, editType: "text", getValue: (u) => u.driversLicense ? toDateInput(u.driversLicense.dateOfBirth) : "" },
    { key: "reservations",  label: "Reservations", defaultVisible: false, render: (u) => u.reservations?.length ?? 0 },
    { key: "reviews",       label: "Reviews",      defaultVisible: false, render: (u) => u.reviews?.length ?? 0 },
];

// ── Edit Form ───────────���───────────────────────────��────────────────────────

interface EditFormProps {
    user: User;
    onSave: (patch: Partial<Pick<User, "firstName" | "lastName" | "email" | "phoneNumber" | "address" | "driversLicense">>) => Promise<void>;
    onCancel: () => void;
}

const EditForm = ({ user, onSave, onCancel }: EditFormProps) => {
    const [firstName, setFirstName] = useState(user.firstName);
    const [lastName,  setLastName]  = useState(user.lastName);
    const [email,     setEmail]     = useState(user.email);
    const [phone,     setPhone]     = useState(user.phoneNumber);
    const [addr,      setAddr]      = useState(user.address ?? { buildingNumber: "", streetName: "", city: "", state: "", zipCode: "" });
    const [dl, setDl] = useState({
        driversLicense: user.driversLicense?.driversLicense ?? "",
        state:          user.driversLicense?.state ?? "",
        expirationDate: user.driversLicense ? toDateInput(user.driversLicense.expirationDate) : "",
        dateOfBirth:    user.driversLicense ? toDateInput(user.driversLicense.dateOfBirth) : "",
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const patch: Parameters<typeof onSave>[0] = {};
            if (firstName !== user.firstName)   patch.firstName   = firstName;
            if (lastName  !== user.lastName)    patch.lastName    = lastName;
            if (email     !== user.email)       patch.email       = email;
            if (phone     !== user.phoneNumber) patch.phoneNumber = phone;

            const newAddr = { ...addr };
            if (JSON.stringify(newAddr) !== JSON.stringify(user.address)) patch.address = newAddr;

            const newDl = {
                driversLicense: dl.driversLicense,
                state:          dl.state,
                expirationDate: toEpoch(dl.expirationDate),
                dateOfBirth:    toEpoch(dl.dateOfBirth),
            };
            if (JSON.stringify(newDl) !== JSON.stringify(user.driversLicense)) patch.driversLicense = newDl;

            await onSave(patch);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={styles.editArea}>
            <div className={styles.editAreaHeader}>
                <span className={styles.editAreaTitle}>Edit User #{user.userId}</span>
                <button className={styles.actionBtn} onClick={onCancel} style={{ opacity: 0.6 }}><BiX /></button>
            </div>
            <div className={styles.editGrid}>
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>First Name</label>
                    <input className={styles.fieldInput} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Last Name</label>
                    <input className={styles.fieldInput} value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Email</label>
                    <input className={styles.fieldInput} value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Phone</label>
                    <input className={styles.fieldInput} value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
            </div>

            <p className={styles.fieldLabel} style={{ marginTop: 16 }}>Address</p>
            <div className={styles.editGrid}>
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Building #</label>
                    <input className={styles.fieldInput} value={addr.buildingNumber} onChange={(e) => setAddr({ ...addr, buildingNumber: e.target.value })} />
                </div>
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Street</label>
                    <input className={styles.fieldInput} value={addr.streetName} onChange={(e) => setAddr({ ...addr, streetName: e.target.value })} />
                </div>
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>City</label>
                    <input className={styles.fieldInput} value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} />
                </div>
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>State</label>
                    <input className={styles.fieldInput} maxLength={2} value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value.toUpperCase() })} />
                </div>
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Zip</label>
                    <input className={styles.fieldInput} value={addr.zipCode} onChange={(e) => setAddr({ ...addr, zipCode: e.target.value })} />
                </div>
            </div>

            <p className={styles.fieldLabel} style={{ marginTop: 16 }}>Driver&apos;s License</p>
            <div className={styles.editGrid}>
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>License #</label>
                    <input className={styles.fieldInput} value={dl.driversLicense} onChange={(e) => setDl({ ...dl, driversLicense: e.target.value })} />
                </div>
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Issuing State</label>
                    <input className={styles.fieldInput} maxLength={2} value={dl.state} onChange={(e) => setDl({ ...dl, state: e.target.value.toUpperCase() })} />
                </div>
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Expiration</label>
                    <input type="date" className={styles.fieldInput} value={dl.expirationDate} onChange={(e) => setDl({ ...dl, expirationDate: e.target.value })} />
                </div>
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Date of Birth</label>
                    <input type="date" className={styles.fieldInput} value={dl.dateOfBirth} onChange={(e) => setDl({ ...dl, dateOfBirth: e.target.value })} />
                </div>
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

const UserProfilesPanel = () => {
    const { isAdmin, canEdit, canDelete, canAddRow, lockedCols, permanentlyLockedCols } = useTablePermissions("users");

    const [users, setUsers] = useState<User[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<Set<string | number>>(new Set());
    const [bulkDeleting, setBulkDeleting] = useState(false);
    const [editing, setEditing] = useState<User | null>(null);
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
            const res = await fetch(`/api/users?${params}`, { cache: "no-store" });
            if (!res.ok) throw new Error(`${res.status}`);
            const data = await res.json();
            setUsers(data?.data ?? []);
            setTotalPages(data?.totalPages ?? 1);
            setTotalItems(data?.totalItems ?? 0);
        } catch (e) {
            alert("Failed to fetch users: " + e);
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
        if (!window.confirm(`Delete ${ids.length} user${ids.length !== 1 ? "s" : ""}? This cannot be undone.`)) return;
        setBulkDeleting(true);
        const results = await Promise.allSettled(ids.map((id) => deleteUser(id)));
        const failed = ids.filter((_, i) => results[i].status === "rejected");
        setBulkDeleting(false);
        if (failed.length) alert(`${failed.length} deletion(s) failed.`);
        setSelected(new Set(failed));
        fetchPage(page, pageSize, sortBy, sortDir, activeFilters, true);
    };

    const handleEdit = (user: User) => {
        if (!canEdit) return;
        setEditing(user);
    };

    const handleDeleteOne = async (user: User) => {
        if (!window.confirm(`Delete user #${user.userId} (${user.firstName} ${user.lastName})? This cannot be undone.`)) return;
        try {
            await deleteUser(user.userId);
            fetchPage(page, pageSize, sortBy, sortDir, activeFilters, true);
        } catch (e) {
            alert("Delete failed: " + e);
        }
    };

    const handleCreateRow = async (data: Record<string, string | string[]>) => {
        const s = (k: string) => String(data[k] ?? "");
        const payload: Record<string, unknown> = {
            firstName:   s("firstName"),
            lastName:    s("lastName"),
            email:       s("email"),
            phoneNumber: s("phoneNumber") || undefined,
        };
        if (s("dlNumber") || s("dlState") || s("dlExpires") || s("dob")) {
            payload.driversLicense = {
                driversLicense: s("dlNumber"),
                state:          s("dlState"),
                expirationDate: s("dlExpires") ? toEpoch(s("dlExpires")) : 0,
                dateOfBirth:    s("dob") ? toEpoch(s("dob")) : 0,
            };
        }
        await createUser(payload);
        fetchPage(page, pageSize, sortBy, sortDir, activeFilters, true);
    };

    const handleSaveEdits = async (edits: RowEdit<User>[]) => {
        await Promise.all(edits.map(({ original, patch }) => {
            const userPatch: Record<string, unknown> = {};
            if (patch.firstName   !== undefined) userPatch.firstName   = patch.firstName;
            if (patch.lastName    !== undefined) userPatch.lastName    = patch.lastName;
            if (patch.email       !== undefined) userPatch.email       = patch.email;
            if (patch.phoneNumber !== undefined) userPatch.phoneNumber = patch.phoneNumber;
            const dlKeys = ["dlNumber", "dlState", "dlExpires", "dob"] as const;
            if (dlKeys.some(k => patch[k] !== undefined)) {
                const ex = original.driversLicense ?? { driversLicense: "", state: "", expirationDate: 0, dateOfBirth: 0 };
                userPatch.driversLicense = {
                    driversLicense: patch.dlNumber  !== undefined ? String(patch.dlNumber)  : ex.driversLicense,
                    state:          patch.dlState   !== undefined ? String(patch.dlState)   : ex.state,
                    expirationDate: patch.dlExpires !== undefined ? toEpoch(String(patch.dlExpires)) : ex.expirationDate,
                    dateOfBirth:    patch.dob       !== undefined ? toEpoch(String(patch.dob))       : ex.dateOfBirth,
                };
            }
            return updateUser(original.userId, userPatch);
        }));
        fetchPage(page, pageSize, sortBy, sortDir, activeFilters, true);
    };

    const handleSaveEdit = async (patch: Partial<Pick<User, "firstName" | "lastName" | "email" | "phoneNumber" | "address" | "driversLicense">>) => {
        if (!editing) return;
        await updateUser(editing.userId, patch);
        setEditing(null);
        fetchPage(page, pageSize, sortBy, sortDir, activeFilters, true);
    };

    const filtered = query
        ? users.filter((u) =>
              `${u.firstName} ${u.lastName} ${u.email} ${u.userId} ${u.phoneNumber}`
                  .toLowerCase()
                  .includes(query.toLowerCase()),
          )
        : users;

    return (
        <>
            <SpreadsheetTable<User>
                columns={USER_COLUMNS}
                data={filtered}
                getRowId={(u) => u.userId}
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
                title="Users Database"
                subtitle={query ? `${filtered.length} matching on this page` : undefined}
                searchQuery={query}
                onSearchChange={setQuery}
                searchPlaceholder="Filter by name, email, ID or phone\u2026"
                emptyMessage="No users found."
                onSaveEdits={canEdit ? handleSaveEdits : undefined}
                onCreateRow={canAddRow ? handleCreateRow : undefined}
                initialLockedCols={lockedCols}
                permanentlyLockedCols={permanentlyLockedCols}
                sortBy={sortBy}
                sortDir={sortDir}
                onSortChange={handleSortChange}
            />
            {editing && (
                <EditForm
                    user={editing}
                    onSave={handleSaveEdit}
                    onCancel={() => setEditing(null)}
                />
            )}
        </>
    );
};

export default UserProfilesPanel;
