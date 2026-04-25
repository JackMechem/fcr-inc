"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Reservation } from "@/app/types/ReservationTypes";
import { deleteReservation, updateReservation } from "../../actions";
import { useTablePermissions } from "../../config/useTablePermissions";
import { useTablePrefsStore } from "@/stores/tablePrefsStore";
import FilterPanel, { ActiveFilter, FilterableColumn, filtersToRecord, formatFilterLabel } from "../table/FilterPanel";
import { BiChevronLeft, BiChevronRight, BiSearch, BiFilter, BiEdit, BiTrash, BiRefresh, BiCalendar, BiX, BiSave } from "react-icons/bi";
import styles from "./listPanel.module.css";

const TABLE_TITLE = "Reservations Database";
const PAGE_SIZE = 25;
const EMPTY_FILTERS: ActiveFilter[] = [];

const FILTERABLE_COLUMNS: FilterableColumn[] = [
    { field: "car",         label: "Car (VIN)",  type: "text" },
    { field: "user",        label: "User ID",    type: "number" },
    { field: "pickUpTime",  label: "Pick-up",    type: "date" },
    { field: "dropOffTime", label: "Drop-off",   type: "date" },
];

const fmtDate = (ts: number | string) => {
    const d = typeof ts === "number" ? new Date(ts * 1000) : new Date(ts + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const toDateStr = (ts: number | string): string => {
    const d = typeof ts === "number" ? new Date(ts * 1000) : new Date(ts);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const fromDateStr = (val: string): number => Math.floor(new Date(val + "T00:00:00").getTime() / 1000);

const carLabel = (r: Reservation) =>
    typeof r.car === "object" && r.car !== null ? `${(r.car as Record<string,string>).make} ${(r.car as Record<string,string>).model}` : String(r.car);

const carVin = (r: Reservation) =>
    typeof r.car === "object" && r.car !== null ? (r.car as Record<string,string>).vin : String(r.car);

const userIdOf = (r: Reservation) =>
    typeof r.user === "object" && r.user !== null
        ? (r.user as Record<string, unknown>).userId as number
        : r.user as number;

// ── Inline Edit Form ──────────────────────────────────────────────────────────

interface EditFormProps {
    res: Reservation;
    onSave: (patch: { pickUpTime?: number; dropOffTime?: number; car?: string; user?: number }) => Promise<void>;
    onCancel: () => void;
}

const EditForm = ({ res, onSave, onCancel }: EditFormProps) => {
    const [pickUp,  setPickUp]  = useState(toDateStr(res.pickUpTime));
    const [dropOff, setDropOff] = useState(toDateStr(res.dropOffTime));
    const [vinVal,  setVinVal]  = useState(carVin(res));
    const [uid,     setUid]     = useState(String(userIdOf(res)));
    const [saving,  setSaving]  = useState(false);
    const [error,   setError]   = useState<string | null>(null);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const patch: Parameters<typeof onSave>[0] = {};
            const newPickUp  = fromDateStr(pickUp);
            const newDropOff = fromDateStr(dropOff);
            if (newPickUp  !== res.pickUpTime)  patch.pickUpTime  = newPickUp;
            if (newDropOff !== res.dropOffTime) patch.dropOffTime = newDropOff;
            if (vinVal !== carVin(res)) patch.car = vinVal;
            const newUid = Number(uid);
            if (newUid !== userIdOf(res)) patch.user = newUid;
            await onSave(patch);
        } catch (e) { setError(String(e)); }
        finally { setSaving(false); }
    };

    return (
        <div className={styles.editRow}>
            <p className={styles.editRowTitle}>Edit Reservation #{res.reservationId}</p>
            <div className={styles.editGrid}>
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Pick-up</label>
                    <input type="date" className={styles.fieldInput} value={pickUp} onChange={(e) => setPickUp(e.target.value)} />
                </div>
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Drop-off</label>
                    <input type="date" className={styles.fieldInput} value={dropOff} onChange={(e) => setDropOff(e.target.value)} />
                </div>
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Car VIN</label>
                    <input className={styles.fieldInput} value={vinVal} onChange={(e) => setVinVal(e.target.value)} />
                </div>
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>User ID</label>
                    <input type="number" className={styles.fieldInput} value={uid} onChange={(e) => setUid(e.target.value)} />
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

export default function ReservationsListPanel() {
    const { canEdit, canDelete } = useTablePermissions("reservations");

    const [reservations, setReservations] = useState<Reservation[]>([]);
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
            const res = await fetch(`/api/reservations?${params}`, { cache: "no-store" });
            const data = await res.json();
            setReservations(data?.data ?? []);
            setTotalPages(data?.totalPages ?? 1);
            setTotalItems(data?.totalItems ?? 0);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchPage(1, activeFilters); }, [fetchPage]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { setPage(1); fetchPage(1, activeFilters); }, [activeFilters]);

    const go = (p: number) => { setPage(p); fetchPage(p, activeFilters); };

    const handleDelete = async (r: Reservation) => {
        if (!window.confirm(`Delete reservation #${r.reservationId}? This cannot be undone.`)) return;
        setDeletingId(r.reservationId);
        try {
            await deleteReservation(r.reservationId);
            fetchPage(page, activeFilters);
        } catch (e) { alert("Delete failed: " + e); }
        finally { setDeletingId(null); }
    };

    const handleSaveEdit = async (res: Reservation, patch: { pickUpTime?: number; dropOffTime?: number; car?: string; user?: number }) => {
        await updateReservation(res.reservationId, patch);
        setEditingId(null);
        fetchPage(page, activeFilters);
    };

    const filtered = query
        ? reservations.filter((r) => `${carLabel(r)} #${r.reservationId} ${userIdOf(r)}`.toLowerCase().includes(query.toLowerCase()))
        : reservations;

    return (
        <div className={styles.container}>
            <div className={styles.topBar}>
                <span className={styles.title}>Reservations <span className={styles.count}>{totalItems}</span></span>
                <div className={styles.topBarRight}>
                    <div className={styles.searchBox}>
                        <BiSearch className={styles.searchIcon} />
                        <input className={styles.searchInput} placeholder="Search car, user ID…" value={query} onChange={(e) => setQuery(e.target.value)} />
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
                                <div className={styles.skeletonLine} style={{ width: "42%" }} />
                                <div className={styles.skeletonLine} style={{ width: "28%" }} />
                            </div>
                        </div>
                    ))
                ) : filtered.length === 0 ? (
                    <div className={styles.empty}>No reservations found.</div>
                ) : (
                    filtered.map((r) => {
                        const paymentCount = Array.isArray(r.payments) ? r.payments.length : 0;
                        return (
                            <div key={r.reservationId}>
                                <div className={styles.row}>
                                    <span className={styles.idPill} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                        <BiCalendar style={{ fontSize: 11 }} />#{r.reservationId}
                                    </span>
                                    <div className={styles.info}>
                                        <span className={styles.primary}>{carLabel(r)}</span>
                                        <span className={styles.secondary}>User #{userIdOf(r)}</span>
                                    </div>
                                    <div className={styles.meta}>
                                        <span className={styles.metaText}>{fmtDate(r.pickUpTime)} → {fmtDate(r.dropOffTime)}</span>
                                        <span className={styles.badge}>{r.durationDays}d</span>
                                        {paymentCount > 0 && (
                                            <span className={styles.badge} style={{ color: "#22c55e", borderColor: "rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.08)" }}>
                                                {paymentCount} pmt{paymentCount !== 1 ? "s" : ""}
                                            </span>
                                        )}
                                    </div>
                                    <div className={styles.actionBtns}>
                                        {canEdit && (
                                            <button className={styles.actionBtn} onClick={() => setEditingId(editingId === r.reservationId ? null : r.reservationId)} title="Edit"><BiEdit /></button>
                                        )}
                                        {canDelete && (
                                            <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={() => handleDelete(r)} disabled={deletingId === r.reservationId} title="Delete">
                                                {deletingId === r.reservationId ? <BiRefresh className={styles.spinning} /> : <BiTrash />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {editingId === r.reservationId && (
                                    <EditForm res={r} onSave={(patch) => handleSaveEdit(r, patch)} onCancel={() => setEditingId(null)} />
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
