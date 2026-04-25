"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getCarsFiltered, deleteCar } from "../../actions";
import { Car } from "@/app/types/CarTypes";
import { useUserDashboardStore } from "@/stores/userDashboardStore";
import { useTablePermissions } from "../../config/useTablePermissions";
import { useTablePrefsStore } from "@/stores/tablePrefsStore";
import FilterPanel, { ActiveFilter, FilterableColumn, filtersToRecord, formatFilterLabel } from "../table/FilterPanel";
import { BiChevronLeft, BiChevronRight, BiSearch, BiFilter, BiEdit, BiTrash, BiRefresh, BiCar, BiX } from "react-icons/bi";
import styles from "./listPanel.module.css";

const TABLE_TITLE = "Cars Database";
const PAGE_SIZE = 25;
const EMPTY_FILTERS: ActiveFilter[] = [];

const FILTERABLE_COLUMNS: FilterableColumn[] = [
    { field: "make",         label: "Make",         type: "text" },
    { field: "model",        label: "Model",        type: "text" },
    { field: "modelYear",    label: "Year",         type: "number" },
    { field: "vehicleClass", label: "Class",        type: "select", options: ["ECONOMY", "LUXURY", "PERFORMANCE", "OFFROAD", "FULL_SIZE", "ELECTRIC"] },
    { field: "carStatus",    label: "Status",       type: "select", options: ["AVAILABLE", "DISABLED", "ARCHIVED", "LOANED", "SERVICE"] },
    { field: "transmission", label: "Transmission", type: "select", options: ["AUTOMATIC", "MANUAL"] },
    { field: "bodyType",     label: "Body Type",    type: "select", options: ["SEDAN", "SUV", "TRUCK", "CONVERTIBLE", "HATCHBACK", "FULL_SIZE", "COMPACT", "WAGON", "ELECTRIC", "COUPE"] },
    { field: "pricePerDay",  label: "Price / Day",  type: "number" },
];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
    AVAILABLE: { bg: "rgba(34,197,94,0.12)",   color: "#22c55e" },
    DISABLED:  { bg: "rgba(234,179,8,0.12)",   color: "#eab308" },
    ARCHIVED:  { bg: "rgba(107,114,128,0.12)", color: "#6b7280" },
    LOANED:    { bg: "rgba(59,130,246,0.12)",  color: "#3b82f6" },
    SERVICE:   { bg: "rgba(249,115,22,0.12)",  color: "#f97316" },
};

export default function CarsListPanel() {
    const { openEditCar } = useUserDashboardStore();
    const { canDelete } = useTablePermissions("cars");

    const [cars, setCars] = useState<Car[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");
    const [deletingVin, setDeletingVin] = useState<string | null>(null);

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
            const params: Record<string, string | number | undefined> = { page: p, pageSize: PAGE_SIZE };
            Object.assign(params, filtersToRecord(filters));
            const res = await getCarsFiltered(params);
            setCars(res.data);
            setTotalPages(res.totalPages);
            setTotalItems(res.totalItems);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchPage(1, activeFilters); }, [fetchPage]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { setPage(1); fetchPage(1, activeFilters); }, [activeFilters]);

    const go = (p: number) => { setPage(p); fetchPage(p, activeFilters); };

    const handleDelete = async (car: Car) => {
        if (!window.confirm(`Delete ${car.modelYear} ${car.make} ${car.model} (${car.vin})? This cannot be undone.`)) return;
        setDeletingVin(car.vin);
        try {
            await deleteCar(car.vin);
            fetchPage(page, activeFilters);
        } catch (e) { alert("Delete failed: " + e); }
        finally { setDeletingVin(null); }
    };

    const filtered = query
        ? cars.filter((c) => `${c.make} ${c.model} ${c.vin} ${c.modelYear}`.toLowerCase().includes(query.toLowerCase()))
        : cars;

    return (
        <div className={styles.container}>
            <div className={styles.topBar}>
                <span className={styles.title}>Cars <span className={styles.count}>{totalItems}</span></span>
                <div className={styles.topBarRight}>
                    <div className={styles.searchBox}>
                        <BiSearch className={styles.searchIcon} />
                        <input className={styles.searchInput} placeholder="Search make, model, VIN…" value={query} onChange={(e) => setQuery(e.target.value)} />
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
                            <div className={styles.skeletonThumb} />
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                                <div className={styles.skeletonLine} style={{ width: "35%" }} />
                                <div className={styles.skeletonLine} style={{ width: "55%" }} />
                            </div>
                        </div>
                    ))
                ) : filtered.length === 0 ? (
                    <div className={styles.empty}>No vehicles found.</div>
                ) : (
                    filtered.map((car) => {
                        const sc = STATUS_COLORS[car.carStatus ?? "AVAILABLE"] ?? STATUS_COLORS.AVAILABLE;
                        return (
                            <div key={car.vin}>
                                <div className={styles.row}>
                                    <div className={styles.thumb}>
                                        {car.images?.[0]
                                            ? <img src={car.images[0]} alt={car.make} className={styles.thumbImg} />
                                            : <BiCar />}
                                    </div>
                                    <div className={styles.info}>
                                        <span className={styles.primary}>{car.modelYear} {car.make} {car.model}</span>
                                        <span className={styles.secondary} style={{ fontFamily: "monospace" }}>{car.vin}</span>
                                    </div>
                                    <div className={styles.meta}>
                                        {car.carStatus && <span className={styles.badge} style={{ background: sc.bg, color: sc.color }}>{car.carStatus}</span>}
                                        {car.vehicleClass && <span className={styles.badge}>{car.vehicleClass}</span>}
                                        <span className={styles.price}>${car.pricePerDay}<span className={styles.priceSub}>/day</span></span>
                                    </div>
                                    <div className={styles.actionBtns}>
                                        <button className={styles.actionBtn} onClick={() => openEditCar(car.vin)} title="Edit"><BiEdit /></button>
                                        {canDelete && (
                                            <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={() => handleDelete(car)} disabled={deletingVin === car.vin} title="Delete">
                                                {deletingVin === car.vin ? <BiRefresh className={styles.spinning} /> : <BiTrash />}
                                            </button>
                                        )}
                                    </div>
                                </div>
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
