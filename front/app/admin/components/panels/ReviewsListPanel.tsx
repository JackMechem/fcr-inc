"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Review } from "@/app/types/ReviewTypes";
import { deleteReview, updateReview } from "../../actions";
import { useTablePermissions } from "../../config/useTablePermissions";
import { useTablePrefsStore } from "@/stores/tablePrefsStore";
import FilterPanel, { ActiveFilter, FilterableColumn, filtersToRecord, formatFilterLabel } from "../table/FilterPanel";
import { BiChevronLeft, BiChevronRight, BiSearch, BiFilter, BiEdit, BiTrash, BiRefresh, BiStar, BiX, BiSave } from "react-icons/bi";
import styles from "./listPanel.module.css";

const TABLE_TITLE = "Reviews Database";
const PAGE_SIZE = 25;
const EMPTY_FILTERS: ActiveFilter[] = [];

const FILTERABLE_COLUMNS: FilterableColumn[] = [
    { field: "stars", label: "Stars",      type: "number" },
    { field: "car",   label: "Car (VIN)",  type: "text" },
];

const fmtDate = (val: string | null) => {
    if (!val) return "—";
    const d = new Date(val);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const Stars = ({ count }: { count: number }) => (
    <span style={{ display: "flex", alignItems: "center", gap: 1 }}>
        {Array.from({ length: 5 }).map((_, i) => (
            <BiStar key={i} style={{ fontSize: 11, color: i < count ? "#f59e0b" : "var(--color-foreground-light)" }} />
        ))}
    </span>
);

const carLabel = (car: Review["car"]) =>
    typeof car === "object" && car !== null ? car.vin : String(car);

const accountLabel = (account: Review["account"]) => {
    if (typeof account === "object" && account !== null) {
        return (account as { name?: string; email?: string }).name
            ?? (account as { name?: string; email?: string }).email
            ?? `#${(account as { acctId: number }).acctId}`;
    }
    return `Account #${account}`;
};

const getCarVin = (car: Review["car"]): string =>
    typeof car === "object" && car !== null ? car.vin : String(car);

const getAccountId = (account: Review["account"]): string =>
    typeof account === "object" && account !== null ? String((account as { acctId: number }).acctId) : String(account);

// ── Inline Edit Form ──────────────────────────────────────────────────────────

interface EditFormProps {
    review: Review;
    onSave: (patch: Partial<Pick<Review, "stars" | "title" | "bodyOfText">>) => Promise<void>;
    onCancel: () => void;
}

const EditForm = ({ review, onSave, onCancel }: EditFormProps) => {
    const [stars,  setStars]  = useState(String(review.stars));
    const [title,  setTitle]  = useState(review.title);
    const [body,   setBody]   = useState(review.bodyOfText);
    const [saving, setSaving] = useState(false);
    const [error,  setError]  = useState<string | null>(null);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const patch: Partial<Pick<Review, "stars" | "title" | "bodyOfText">> = {};
            const starsNum = Number(stars);
            if (starsNum !== review.stars) patch.stars = starsNum;
            if (title !== review.title)    patch.title = title;
            if (body  !== review.bodyOfText) patch.bodyOfText = body;
            await onSave(patch);
        } catch (e) { setError(String(e)); }
        finally { setSaving(false); }
    };

    return (
        <div className={styles.editRow}>
            <p className={styles.editRowTitle}>Edit Review #{review.reviewId}</p>
            <div className={styles.editGrid}>
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Stars (1–5)</label>
                    <input type="number" min={1} max={5} className={styles.fieldInput} value={stars} onChange={(e) => setStars(e.target.value)} />
                </div>
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Title</label>
                    <input className={styles.fieldInput} value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className={styles.fieldGroup} style={{ gridColumn: "1 / -1" }}>
                    <label className={styles.fieldLabel}>Body</label>
                    <textarea className={styles.fieldInput} value={body} onChange={(e) => setBody(e.target.value)} rows={3} style={{ resize: "vertical" }} />
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

export default function ReviewsListPanel() {
    const { canEdit, canDelete } = useTablePermissions("reviews");

    const [reviews, setReviews] = useState<Review[]>([]);
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
            const res = await fetch(`/api/reviews?${params}`, { cache: "no-store" });
            const data = await res.json();
            setReviews(data?.data ?? []);
            setTotalPages(data?.totalPages ?? 1);
            setTotalItems(data?.totalItems ?? 0);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchPage(1, activeFilters); }, [fetchPage]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { setPage(1); fetchPage(1, activeFilters); }, [activeFilters]);

    const go = (p: number) => { setPage(p); fetchPage(p, activeFilters); };

    const handleDelete = async (r: Review) => {
        if (!window.confirm(`Delete review #${r.reviewId} "${r.title}"? This cannot be undone.`)) return;
        setDeletingId(r.reviewId);
        try {
            await deleteReview(r.reviewId);
            fetchPage(page, activeFilters);
        } catch (e) { alert("Delete failed: " + e); }
        finally { setDeletingId(null); }
    };

    const handleSaveEdit = async (r: Review, patch: Partial<Pick<Review, "stars" | "title" | "bodyOfText">>) => {
        await updateReview(r.reviewId, { ...patch, car: getCarVin(r.car), account: getAccountId(r.account) });
        setEditingId(null);
        fetchPage(page, activeFilters);
    };

    const filtered = query
        ? reviews.filter((r) => `${r.title} ${accountLabel(r.account)} ${carLabel(r.car)}`.toLowerCase().includes(query.toLowerCase()))
        : reviews;

    return (
        <div className={styles.container}>
            <div className={styles.topBar}>
                <span className={styles.title}>Reviews <span className={styles.count}>{totalItems}</span></span>
                <div className={styles.topBarRight}>
                    <div className={styles.searchBox}>
                        <BiSearch className={styles.searchIcon} />
                        <input className={styles.searchInput} placeholder="Search title, account, car…" value={query} onChange={(e) => setQuery(e.target.value)} />
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
                                <div className={styles.skeletonLine} style={{ width: "40%" }} />
                                <div className={styles.skeletonLine} style={{ width: "55%" }} />
                            </div>
                        </div>
                    ))
                ) : filtered.length === 0 ? (
                    <div className={styles.empty}>No reviews found.</div>
                ) : (
                    filtered.map((r) => (
                        <div key={r.reviewId}>
                            <div className={styles.row}>
                                <span className={styles.idPill}>#{r.reviewId}</span>
                                <div className={styles.info}>
                                    <span className={styles.primary}>{r.title}</span>
                                    <span className={styles.secondary}>{accountLabel(r.account)} · {carLabel(r.car)}</span>
                                </div>
                                <div className={styles.meta}>
                                    <Stars count={r.stars} />
                                    <span className={styles.badge}>{r.rentalDuration}d</span>
                                    <span className={styles.metaText}>{fmtDate(r.publishedDate)}</span>
                                </div>
                                <div className={styles.actionBtns}>
                                    {canEdit && (
                                        <button className={styles.actionBtn} onClick={() => setEditingId(editingId === r.reviewId ? null : r.reviewId)} title="Edit"><BiEdit /></button>
                                    )}
                                    {canDelete && (
                                        <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={() => handleDelete(r)} disabled={deletingId === r.reviewId} title="Delete">
                                            {deletingId === r.reviewId ? <BiRefresh className={styles.spinning} /> : <BiTrash />}
                                        </button>
                                    )}
                                </div>
                            </div>
                            {editingId === r.reviewId && (
                                <EditForm review={r} onSave={(patch) => handleSaveEdit(r, patch)} onCancel={() => setEditingId(null)} />
                            )}
                        </div>
                    ))
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
