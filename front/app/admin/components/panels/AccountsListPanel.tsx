"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Account, AccountRole } from "@/app/lib/fcr-client";
import { deleteAccount, updateAccount } from "../../actions";
import { useTablePermissions } from "../../config/useTablePermissions";
import { useTablePrefsStore } from "@/stores/tablePrefsStore";
import FilterPanel, { ActiveFilter, FilterableColumn, filtersToRecord, formatFilterLabel } from "../table/FilterPanel";
import { BiChevronLeft, BiChevronRight, BiSearch, BiFilter, BiEdit, BiTrash, BiRefresh, BiX, BiSave } from "react-icons/bi";
import styles from "./listPanel.module.css";

const TABLE_TITLE = "Accounts Database";
const PAGE_SIZE = 25;
const EMPTY_FILTERS: ActiveFilter[] = [];

const FILTERABLE_COLUMNS: FilterableColumn[] = [
    { field: "search", label: "Name / Email", type: "text" },
    { field: "role",   label: "Role",         type: "select", options: ["ADMIN", "STAFF", "USER"] },
];

const AVATAR_COLORS = ["#3b82f6","#8b5cf6","#ec4899","#f97316","#22c55e","#06b6d4","#f59e0b","#ef4444"];
const avatarColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
const initials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
};

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
    ADMIN:    { bg: "rgba(239,68,68,0.12)",  color: "#ef4444" },
    STAFF:    { bg: "rgba(59,130,246,0.12)", color: "#3b82f6" },
    CUSTOMER: { bg: "var(--color-primary-dark)", color: "var(--color-foreground-light)" },
};

const fmtDate = (val: string | number | null) => {
    if (!val) return "—";
    const ms = typeof val === "number" ? val * 1000 : new Date(val).getTime();
    return new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

// ── Inline Edit Form ──────────────────────────────────────────────────────────

interface EditFormProps {
    account: Account;
    isAdmin: boolean;
    onSave: (patch: Partial<Pick<Account, "name" | "email" | "role">>) => Promise<void>;
    onCancel: () => void;
}

const EditForm = ({ account, isAdmin, onSave, onCancel }: EditFormProps) => {
    const [name,  setName]  = useState(account.name);
    const [email, setEmail] = useState(account.email);
    const [role,  setRole]  = useState<AccountRole>(account.role);
    const [saving, setSaving] = useState(false);
    const [error,  setError]  = useState<string | null>(null);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const patch: Partial<Pick<Account, "name" | "email" | "role">> = {};
            if (name  !== account.name)  patch.name  = name;
            if (email !== account.email) patch.email = email;
            if (role  !== account.role)  patch.role  = role;
            await onSave(patch);
        } catch (e) { setError(String(e)); }
        finally { setSaving(false); }
    };

    return (
        <div className={styles.editRow}>
            <p className={styles.editRowTitle}>Edit Account #{account.acctId}</p>
            <div className={styles.editGrid}>
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Name</label>
                    <input className={styles.fieldInput} value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Email</label>
                    <input className={styles.fieldInput} value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                {isAdmin && (
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

export default function AccountsListPanel() {
    const { isAdmin, canEdit, canDelete } = useTablePermissions("accounts");

    const [accounts, setAccounts] = useState<Account[]>([]);
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
            const res = await fetch(`/api/accounts?${params}`, { cache: "no-store" });
            const data = await res.json();
            setAccounts(data?.data ?? []);
            setTotalPages(data?.totalPages ?? 1);
            setTotalItems(data?.totalItems ?? 0);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchPage(1, activeFilters); }, [fetchPage]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { setPage(1); fetchPage(1, activeFilters); }, [activeFilters]);

    const go = (p: number) => { setPage(p); fetchPage(p, activeFilters); };

    const handleDelete = async (a: Account) => {
        if (!window.confirm(`Delete account "${a.name}" (${a.email})? This cannot be undone.`)) return;
        setDeletingId(a.acctId);
        try {
            await deleteAccount(a.acctId);
            fetchPage(page, activeFilters);
        } catch (e) { alert("Delete failed: " + e); }
        finally { setDeletingId(null); }
    };

    const handleSaveEdit = async (a: Account, patch: Partial<Pick<Account, "name" | "email" | "role">>) => {
        await updateAccount(a.acctId, patch);
        setEditingId(null);
        fetchPage(page, activeFilters);
    };

    const filtered = query
        ? accounts.filter((a) => `${a.name} ${a.email} ${a.role}`.toLowerCase().includes(query.toLowerCase()))
        : accounts;

    return (
        <div className={styles.container}>
            <div className={styles.topBar}>
                <span className={styles.title}>Accounts <span className={styles.count}>{totalItems}</span></span>
                <div className={styles.topBarRight}>
                    <div className={styles.searchBox}>
                        <BiSearch className={styles.searchIcon} />
                        <input className={styles.searchInput} placeholder="Search name, email, role…" value={query} onChange={(e) => setQuery(e.target.value)} />
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
                                <div className={styles.skeletonLine} style={{ width: "35%" }} />
                                <div className={styles.skeletonLine} style={{ width: "52%" }} />
                            </div>
                        </div>
                    ))
                ) : filtered.length === 0 ? (
                    <div className={styles.empty}>No accounts found.</div>
                ) : (
                    filtered.map((a) => {
                        const rc = ROLE_COLORS[a.role] ?? ROLE_COLORS.CUSTOMER;
                        return (
                            <div key={a.acctId}>
                                <div className={styles.row}>
                                    <div className={styles.avatar} style={{ background: avatarColor(a.name) }}>
                                        {initials(a.name)}
                                    </div>
                                    <div className={styles.info}>
                                        <span className={styles.primary}>{a.name}</span>
                                        <span className={styles.secondary}>{a.email}</span>
                                    </div>
                                    <div className={styles.meta}>
                                        <span className={styles.badge} style={{ background: rc.bg, color: rc.color }}>{a.role}</span>
                                        <span className={styles.metaText}>{fmtDate(a.dateCreated)}</span>
                                    </div>
                                    <div className={styles.actionBtns}>
                                        {canEdit && (
                                            <button className={styles.actionBtn} onClick={() => setEditingId(editingId === a.acctId ? null : a.acctId)} title="Edit"><BiEdit /></button>
                                        )}
                                        {canDelete && (
                                            <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={() => handleDelete(a)} disabled={deletingId === a.acctId} title="Delete">
                                                {deletingId === a.acctId ? <BiRefresh className={styles.spinning} /> : <BiTrash />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {editingId === a.acctId && (
                                    <EditForm account={a} isAdmin={isAdmin} onSave={(patch) => handleSaveEdit(a, patch)} onCancel={() => setEditingId(null)} />
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
