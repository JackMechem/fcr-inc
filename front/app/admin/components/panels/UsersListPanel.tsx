"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { User } from "@/app/lib/fcr-client";
import { deleteUser, updateUser } from "../../actions";
import { useTablePermissions } from "../../config/useTablePermissions";
import { useTablePrefsStore } from "@/stores/tablePrefsStore";
import FilterPanel, { ActiveFilter, FilterableColumn, filtersToRecord, formatFilterLabel } from "../table/FilterPanel";
import { BiChevronLeft, BiChevronRight, BiSearch, BiFilter, BiEdit, BiTrash, BiRefresh, BiCheck, BiX, BiSave } from "react-icons/bi";
import styles from "./listPanel.module.css";

const TABLE_TITLE = "Users Database";
const PAGE_SIZE = 25;
const EMPTY_FILTERS: ActiveFilter[] = [];

const FILTERABLE_COLUMNS: FilterableColumn[] = [
    { field: "firstName", label: "First Name", type: "text" },
    { field: "lastName",  label: "Last Name",  type: "text" },
    { field: "email",     label: "Email",      type: "text" },
];

const AVATAR_COLORS = ["#3b82f6","#8b5cf6","#ec4899","#f97316","#22c55e","#06b6d4","#f59e0b","#ef4444"];
const avatarColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
const initials = (firstName: string, lastName: string) =>
    (firstName[0] ?? "").toUpperCase() + (lastName[0] ?? "").toUpperCase();

const fmtDate = (val: string | number | null) => {
    if (!val) return "—";
    const ms = typeof val === "number" ? val * 1000 : new Date(val).getTime();
    return new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

// ── Inline Edit Form ──────────────────────────────────────────────────────────

interface EditFormProps {
    user: User;
    onSave: (patch: Partial<Pick<User, "firstName" | "lastName" | "email" | "phoneNumber">>) => Promise<void>;
    onCancel: () => void;
}

const EditForm = ({ user, onSave, onCancel }: EditFormProps) => {
    const [firstName, setFirstName] = useState(user.firstName);
    const [lastName,  setLastName]  = useState(user.lastName);
    const [email,     setEmail]     = useState(user.email);
    const [phone,     setPhone]     = useState(user.phoneNumber ?? "");
    const [saving,    setSaving]    = useState(false);
    const [error,     setError]     = useState<string | null>(null);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const patch: Partial<Pick<User, "firstName" | "lastName" | "email" | "phoneNumber">> = {};
            if (firstName !== user.firstName)     patch.firstName   = firstName;
            if (lastName  !== user.lastName)      patch.lastName    = lastName;
            if (email     !== user.email)         patch.email       = email;
            if (phone     !== (user.phoneNumber ?? "")) patch.phoneNumber = phone;
            await onSave(patch);
        } catch (e) { setError(String(e)); }
        finally { setSaving(false); }
    };

    return (
        <div className={styles.editRow}>
            <p className={styles.editRowTitle}>Edit User #{user.userId}</p>
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
                    <input className={styles.fieldInput} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
                </div>
            </div>
            {error && <p className={styles.errorMsg}>{error}</p>}
            <div className={styles.formActions}>
                <button className={`${styles.formBtn} ${styles.formBtnPrimary}`} onClick={handleSave} disabled={saving}>
                    {saving ? <BiRefresh className={styles.spinning} /> : <BiSave />} Save
                </button>
                <button className={styles.formBtn} onClick={onCancel}>Cancel</button>
            </div>
        </div>
    );
};

// ── Panel ─────────────────────────────────────────────────────────────────────

export default function UsersListPanel() {
    const { canEdit, canDelete } = useTablePermissions("users");

    const [users, setUsers] = useState<User[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const storedFilters = useTablePrefsStore((s) => s.tableFilters[TABLE_TITLE]);
    const storeSetFilters = useTablePrefsStore((s) => s.setTableFilters);
    const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>((storedFilters ?? EMPTY_FILTERS) as ActiveFilter[]);
    const handleFiltersChange = (f: ActiveFilter[]) => { setActiveFilters(f); storeSetFilters(TABLE_TITLE, f); };
    const filterBtnRef = useRef<HTMLButtonElement>(null);
    const [filterOpen, setFilterOpen] = useState(false);
    const [filterPos, setFilterPos] = useState({ top: 0, right: 0 });
    const [filterEditId, setFilterEditId] = useState<string | null>(null);
    const openFilterPanel = (editId?: string) => {
        if (!filterBtnRef.current) return;
        const r = filterBtnRef.current.getBoundingClientRect();
        setFilterPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
        setFilterEditId(editId ?? null);
        setFilterOpen(true);
    };

    const fetchPage = useCallback(async (p: number, filters: ActiveFilter[] = []) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(p), pageSize: String(PAGE_SIZE) });
            Object.entries(filtersToRecord(filters)).forEach(([k, v]) => { if (v !== undefined) params.set(k, String(v)); });
            const res = await fetch(`/api/users?${params}`, { cache: "no-store" });
            const data = await res.json();
            setUsers(data?.data ?? []);
            setTotalPages(data?.totalPages ?? 1);
            setTotalItems(data?.totalItems ?? 0);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchPage(1, activeFilters); }, [fetchPage]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { setPage(1); fetchPage(1, activeFilters); }, [activeFilters]);

    const go = (p: number) => { setPage(p); fetchPage(p, activeFilters); };

    const handleDelete = async (u: User) => {
        if (!window.confirm(`Delete user ${u.firstName} ${u.lastName}? This cannot be undone.`)) return;
        setDeletingId(u.userId);
        try {
            await deleteUser(u.userId);
            fetchPage(page, activeFilters);
        } catch (e) { alert("Delete failed: " + e); }
        finally { setDeletingId(null); }
    };

    const handleSaveEdit = async (u: User, patch: Partial<Pick<User, "firstName" | "lastName" | "email" | "phoneNumber">>) => {
        await updateUser(u.userId, patch as Record<string, unknown>);
        setEditingId(null);
        fetchPage(page, activeFilters);
    };

    const filtered = query
        ? users.filter((u) => `${u.firstName} ${u.lastName} ${u.email} ${u.phoneNumber ?? ""}`.toLowerCase().includes(query.toLowerCase()))
        : users;

    return (
        <div className={styles.container}>
            <div className={styles.topBar}>
                <span className={styles.title}>User Profiles <span className={styles.count}>{totalItems}</span></span>
                <div className={styles.topBarRight}>
                    <div className={styles.searchBox}>
                        <BiSearch className={styles.searchIcon} />
                        <input className={styles.searchInput} placeholder="Search name, email…" value={query} onChange={(e) => setQuery(e.target.value)} />
                        {query && <button style={{ background: "none", border: "none", color: "var(--color-foreground-light)", cursor: "pointer", display: "flex", padding: 0 }} onClick={() => setQuery("")}><BiX style={{ fontSize: 13 }} /></button>}
                    </div>
                    <button ref={filterBtnRef} onClick={() => openFilterPanel()} className={`${styles.filterBtn} ${filterOpen ? styles.filterBtnActive : ""} ${activeFilters.length ? styles.filterBtnBadge : ""}`} data-count={activeFilters.length || undefined} title="Filter">
                        <BiFilter />
                    </button>
                </div>
            </div>

            {activeFilters.length > 0 && (
                <div className={styles.filterChipsBar}>
                    {activeFilters.map((f) => (
                        <button key={f.id} className={styles.filterChip} onClick={() => openFilterPanel(f.id)}>
                            {formatFilterLabel(f)}
                            <span className={styles.filterChipX} onClick={(e) => { e.stopPropagation(); handleFiltersChange(activeFilters.filter((x) => x.id !== f.id)); }}><BiX /></span>
                        </button>
                    ))}
                    <button className={styles.filterChipClear} onClick={() => handleFiltersChange([])}>Clear all</button>
                </div>
            )}

            <div className={styles.list}>
                {loading ? (
                    Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className={styles.skeletonRow}>
                            <div className={styles.skeletonCircle} />
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                                <div className={styles.skeletonLine} style={{ width: "32%" }} />
                                <div className={styles.skeletonLine} style={{ width: "48%" }} />
                            </div>
                        </div>
                    ))
                ) : filtered.length === 0 ? (
                    <div className={styles.empty}>No users found.</div>
                ) : (
                    filtered.map((u) => {
                        const fullName = `${u.firstName} ${u.lastName}`;
                        const hasDl = !!u.driversLicense;
                        return (
                            <div key={u.userId}>
                                <div className={styles.row}>
                                    <div className={styles.avatar} style={{ background: avatarColor(u.firstName) }}>
                                        {initials(u.firstName, u.lastName)}
                                    </div>
                                    <div className={styles.info}>
                                        <span className={styles.primary}>{fullName}</span>
                                        <span className={styles.secondary}>{u.email}</span>
                                    </div>
                                    <div className={styles.meta}>
                                        {u.phoneNumber && <span className={styles.metaText}>{u.phoneNumber}</span>}
                                        {hasDl && (
                                            <span className={styles.badge} style={{ color: "#22c55e", borderColor: "rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.08)", gap: 3 }}>
                                                <BiCheck style={{ fontSize: 11 }} /> DL
                                            </span>
                                        )}
                                        <span className={styles.metaText}>{fmtDate(u.dateCreated)}</span>
                                    </div>
                                    <div className={styles.actionBtns}>
                                        {canEdit && (
                                            <button className={styles.actionBtn} onClick={() => setEditingId(editingId === u.userId ? null : u.userId)} title="Edit"><BiEdit /></button>
                                        )}
                                        {canDelete && (
                                            <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={() => handleDelete(u)} disabled={deletingId === u.userId} title="Delete">
                                                {deletingId === u.userId ? <BiRefresh className={styles.spinning} /> : <BiTrash />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {editingId === u.userId && (
                                    <EditForm user={u} onSave={(patch) => handleSaveEdit(u, patch)} onCancel={() => setEditingId(null)} />
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {totalPages > 1 && (
                <div className={styles.pagination}>
                    <button className={styles.pageBtn} disabled={page <= 1} onClick={() => go(page - 1)}><BiChevronLeft /></button>
                    <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
                    <button className={styles.pageBtn} disabled={page >= totalPages} onClick={() => go(page + 1)}><BiChevronRight /></button>
                </div>
            )}

            {filterOpen && (
                <FilterPanel
                    filterableColumns={FILTERABLE_COLUMNS}
                    activeFilters={activeFilters}
                    onAdd={(f) => handleFiltersChange([...activeFilters, f])}
                    onRemove={(id) => handleFiltersChange(activeFilters.filter((f) => f.id !== id))}
                    onUpdate={(updated) => handleFiltersChange(activeFilters.map((f) => f.id === updated.id ? updated : f))}
                    onClose={() => setFilterOpen(false)}
                    pos={filterPos}
                    initialEditId={filterEditId}
                />
            )}
        </div>
    );
}
