"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Payment } from "@/app/lib/fcr-client";
import { deletePayment, updatePayment } from "../../actions";
import { useTablePermissions } from "../../config/useTablePermissions";
import { useTablePrefsStore } from "@/stores/tablePrefsStore";
import FilterPanel, { ActiveFilter, FilterableColumn, filtersToRecord, formatFilterLabel } from "../table/FilterPanel";
import { BiChevronLeft, BiChevronRight, BiSearch, BiFilter, BiEdit, BiTrash, BiRefresh, BiCheck, BiX, BiSave } from "react-icons/bi";
import styles from "./listPanel.module.css";

const TABLE_TITLE = "All Payments";
const PAGE_SIZE = 25;
const EMPTY_FILTERS: ActiveFilter[] = [];

const FILTERABLE_COLUMNS: FilterableColumn[] = [
    { field: "paymentType", label: "Type",        type: "select", options: ["CASH", "CREDIT", "DEBIT", "CHECK", "SERVICE", "INVOICE"] },
    { field: "paid",        label: "Paid",        type: "select", options: ["true", "false"] },
    { field: "totalAmount", label: "Total",       type: "number" },
    { field: "amountPaid",  label: "Amount Paid", type: "number" },
];

const PAYMENT_TYPES = ["CASH", "CREDIT", "DEBIT", "CHECK", "SERVICE", "INVOICE"];

const fmtDate = (ts: number) =>
    new Date(ts * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const toIsoDate = (ts: number): string =>
    new Date(ts * 1000).toISOString().split("T")[0];

const fmtAmount = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
    CARD:    { bg: "rgba(59,130,246,0.1)",  color: "#3b82f6" },
    CASH:    { bg: "rgba(34,197,94,0.1)",   color: "#22c55e" },
    INVOICE: { bg: "rgba(245,158,11,0.1)",  color: "#f59e0b" },
    CREDIT:  { bg: "rgba(59,130,246,0.1)",  color: "#3b82f6" },
    DEBIT:   { bg: "rgba(59,130,246,0.1)",  color: "#3b82f6" },
    CHECK:   { bg: "rgba(107,114,128,0.1)", color: "#6b7280" },
    SERVICE: { bg: "rgba(249,115,22,0.1)",  color: "#f97316" },
};

// ── Inline Edit Form ──────────────────────────────────────────────────────────

interface EditFormProps {
    payment: Payment;
    onSave: (patch: Partial<Payment>) => Promise<void>;
    onCancel: () => void;
}

const EditForm = ({ payment, onSave, onCancel }: EditFormProps) => {
    const [totalAmount, setTotalAmount] = useState(String(payment.totalAmount));
    const [amountPaid,  setAmountPaid]  = useState(String(payment.amountPaid));
    const [date,        setDate]        = useState(toIsoDate(payment.date));
    const [ptype,       setPtype]       = useState(payment.paymentType);
    const [saving,      setSaving]      = useState(false);
    const [error,       setError]       = useState<string | null>(null);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            await onSave({
                totalAmount: Number(totalAmount),
                amountPaid:  Number(amountPaid),
                date: new Date(date + "T00:00:00").toISOString() as unknown as number,
                paymentType: ptype,
            });
        } catch (e) { setError(String(e)); }
        finally { setSaving(false); }
    };

    return (
        <div className={styles.editRow}>
            <p className={styles.editRowTitle}>Edit Payment</p>
            <div className={styles.editGrid}>
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Total ($)</label>
                    <input type="number" step="0.01" className={styles.fieldInput} value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} />
                </div>
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Paid ($)</label>
                    <input type="number" step="0.01" className={styles.fieldInput} value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} />
                </div>
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Date</label>
                    <input type="date" className={styles.fieldInput} value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Type</label>
                    <select className={styles.fieldInput} value={ptype} onChange={(e) => setPtype(e.target.value)}>
                        {PAYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
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

export default function PaymentsListPanel() {
    const { canEdit, canDelete } = useTablePermissions("payments");

    const [payments, setPayments] = useState<Payment[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

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
            const res = await fetch(`/api/payments?${params}`, { cache: "no-store" });
            const data = await res.json();
            setPayments(data?.data ?? []);
            setTotalPages(data?.totalPages ?? 1);
            setTotalItems(data?.totalItems ?? 0);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchPage(1, activeFilters); }, [fetchPage]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { setPage(1); fetchPage(1, activeFilters); }, [activeFilters]);

    const go = (p: number) => { setPage(p); fetchPage(p, activeFilters); };

    const handleDelete = async (p: Payment) => {
        if (!window.confirm(`Delete payment ${p.paymentId}? This cannot be undone.`)) return;
        setDeletingId(p.paymentId);
        try {
            await deletePayment(p.paymentId);
            fetchPage(page, activeFilters);
        } catch (e) { alert("Delete failed: " + e); }
        finally { setDeletingId(null); }
    };

    const handleSaveEdit = async (p: Payment, patch: Partial<Payment>) => {
        await updatePayment(p.paymentId, patch as Record<string, unknown>);
        setEditingId(null);
        fetchPage(page, activeFilters);
    };

    const filtered = query
        ? payments.filter((p) => `${p.paymentId} ${p.paymentType}`.toLowerCase().includes(query.toLowerCase()))
        : payments;

    return (
        <div className={styles.container}>
            <div className={styles.topBar}>
                <span className={styles.title}>Payments <span className={styles.count}>{totalItems}</span></span>
                <div className={styles.topBarRight}>
                    <div className={styles.searchBox}>
                        <BiSearch className={styles.searchIcon} />
                        <input className={styles.searchInput} placeholder="Search ID, type…" value={query} onChange={(e) => setQuery(e.target.value)} />
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
                            <div className={styles.skeletonCircle} style={{ borderRadius: 6, width: 34, height: 34 }} />
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                                <div className={styles.skeletonLine} style={{ width: "30%" }} />
                                <div className={styles.skeletonLine} style={{ width: "45%" }} />
                            </div>
                        </div>
                    ))
                ) : filtered.length === 0 ? (
                    <div className={styles.empty}>No payments found.</div>
                ) : (
                    filtered.map((p) => {
                        const tc = TYPE_COLORS[p.paymentType] ?? TYPE_COLORS.CASH;
                        const shortId = p.paymentId.length > 20 ? `…${p.paymentId.slice(-14)}` : p.paymentId;
                        return (
                            <div key={p.paymentId}>
                                <div className={styles.row}>
                                    <span className={styles.idPill} style={{ fontFamily: "monospace" }}>{shortId}</span>
                                    <div className={styles.info}>
                                        <span className={styles.primary}>{fmtAmount(p.totalAmount)}</span>
                                        <span className={styles.secondary}>Paid: {fmtAmount(p.amountPaid)}</span>
                                    </div>
                                    <div className={styles.meta}>
                                        <span className={styles.badge} style={{ background: tc.bg, color: tc.color }}>{p.paymentType}</span>
                                        {p.paid ? (
                                            <span className={styles.badge} style={{ color: "#22c55e", borderColor: "rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.08)", gap: 3 }}>
                                                <BiCheck style={{ fontSize: 11 }} /> Paid
                                            </span>
                                        ) : (
                                            <span className={styles.badge} style={{ color: "#ef4444", borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", gap: 3 }}>
                                                <BiX style={{ fontSize: 11 }} /> Unpaid
                                            </span>
                                        )}
                                        <span className={styles.metaText}>{fmtDate(p.date)}</span>
                                    </div>
                                    <div className={styles.actionBtns}>
                                        {canEdit && (
                                            <button className={styles.actionBtn} onClick={() => setEditingId(editingId === p.paymentId ? null : p.paymentId)} title="Edit"><BiEdit /></button>
                                        )}
                                        {canDelete && (
                                            <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={() => handleDelete(p)} disabled={deletingId === p.paymentId} title="Delete">
                                                {deletingId === p.paymentId ? <BiRefresh className={styles.spinning} /> : <BiTrash />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {editingId === p.paymentId && (
                                    <EditForm payment={p} onSave={(patch) => handleSaveEdit(p, patch)} onCancel={() => setEditingId(null)} />
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
