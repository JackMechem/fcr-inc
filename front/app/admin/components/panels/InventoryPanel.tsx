"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { getCarsFiltered, getCarById, deleteCar, updateCar, addCar } from "../../actions";
import { Car, CarStatus } from "@/app/types/CarTypes";
import { useUserDashboardStore } from "@/stores/userDashboardStore";
import SpreadsheetTable, { Column, RowEdit } from "../table/SpreadsheetTable";
import { useTablePermissions } from "../../config/useTablePermissions";
import { ActiveFilter, FilterableColumn, filtersToRecord } from "../table/FilterPanel";
import { consumePendingJump } from "../../config/pendingJump";
import { useTablePrefsStore } from "@/stores/tablePrefsStore";
import { getFilterBarData } from "@/app/browse/actions";
import styles from "../table/spreadsheetTable.module.css";

const TABLE_TITLE = "Cars Database";
const EMPTY_FILTERS: ActiveFilter[] = [];
import { BiSearch, BiX, BiImages } from "react-icons/bi";
import ReactMarkdown from "react-markdown";
import { callGemini } from "@/app/lib/gemini";

// ── Status badge ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<CarStatus, { bg: string; color: string }> = {
    AVAILABLE: { bg: "rgba(34,197,94,0.12)", color: "#22c55e" },
    DISABLED:  { bg: "rgba(234,179,8,0.12)",  color: "#eab308" },
    ARCHIVED:  { bg: "rgba(107,114,128,0.12)", color: "#6b7280" },
    LOANED:    { bg: "rgba(59,130,246,0.12)",  color: "#3b82f6" },
    SERVICE:   { bg: "rgba(249,115,22,0.12)",  color: "#f97316" },
};

const StatusBadge = ({ status }: { status?: CarStatus }) => {
    const s = status ?? "AVAILABLE";
    const c = STATUS_COLORS[s] ?? STATUS_COLORS.AVAILABLE;
    return (
        <span
            className={styles.statusBadge}
            style={{ backgroundColor: c.bg, color: c.color }}
        >
            {s}
        </span>
    );
};

// ── Column definitions ───────────────────────────────────────────────────────

const ctx = (c: Car) => `${c.modelYear ?? ""} ${c.make} ${c.model}`.trim();
const specAi = (label: string) => (c: Car) =>
    callGemini(`What is the ${label} of a ${ctx(c)}? Reply with only the numeric value, no units or extra text.`);
const selectAi = (label: string, opts: string[]) => (c: Car) =>
    callGemini(`For a ${ctx(c)}, which of these best describes its ${label}: ${opts.join(", ")}? Reply with only one of those exact values, no extra text.`);

const CAR_COLUMNS: Column<Car>[] = [
    { key: "vin",          label: "VIN",          defaultVisible: true,  render: (c) => c.vin, minWidth: 170, editable: true, editType: "text", getValue: (c) => c.vin },
    { key: "make",         label: "Make",         defaultVisible: true,  render: (c) => c.make,      editable: true, editType: "text",   getValue: (c) => c.make },
    { key: "model",        label: "Model",        defaultVisible: true,  render: (c) => c.model,     editable: true, editType: "text",   getValue: (c) => c.model },
    { key: "modelYear",    label: "Year",         defaultVisible: true,  render: (c) => c.modelYear, editable: true, editType: "number", getValue: (c) => c.modelYear },
    { key: "vehicleClass", label: "Class",        defaultVisible: true,  render: (c) => <span className={styles.badge}>{c.vehicleClass}</span>, editable: true, editType: "select", editOptions: ["ECONOMY", "LUXURY", "PERFORMANCE", "OFFROAD", "FULL_SIZE", "ELECTRIC"], getValue: (c) => c.vehicleClass ?? "",
        aiGenerate: selectAi("vehicle class", ["ECONOMY", "LUXURY", "PERFORMANCE", "OFFROAD", "FULL_SIZE", "ELECTRIC"]) },
    { key: "carStatus",    label: "Status",       defaultVisible: true,  render: (c) => <StatusBadge status={c.carStatus} />, editable: true, editType: "select", editOptions: ["AVAILABLE", "DISABLED", "ARCHIVED", "LOANED", "SERVICE"], getValue: (c) => c.carStatus ?? "" },
    { key: "pricePerDay",  label: "Price / Day",  defaultVisible: true,  render: (c) => <span style={{ color: "var(--color-accent)", fontWeight: 600 }}>${c.pricePerDay}</span>, editable: true, editType: "number", getValue: (c) => c.pricePerDay,
        aiGenerate: (c) => callGemini(`Suggest a reasonable daily rental price in USD for a ${ctx(c)} at a luxury car rental company. Reply with only the number, no $ sign or extra text.`) },
    { key: "bodyType",     label: "Body Type",    defaultVisible: false, render: (c) => c.bodyType ? <span className={styles.badge}>{c.bodyType}</span> : "—",        editable: true, editType: "select", editOptions: ["SEDAN", "SUV", "TRUCK", "CONVERTIBLE", "HATCHBACK", "FULL_SIZE", "COMPACT", "WAGON", "ELECTRIC", "COUPE"], getValue: (c) => c.bodyType ?? "",
        aiGenerate: selectAi("body type", ["SEDAN", "SUV", "TRUCK", "CONVERTIBLE", "HATCHBACK", "FULL_SIZE", "COMPACT", "WAGON", "ELECTRIC", "COUPE"]) },
    { key: "transmission", label: "Transmission", defaultVisible: false, render: (c) => c.transmission ? <span className={styles.badge}>{c.transmission}</span> : "—", editable: true, editType: "select", editOptions: ["AUTOMATIC", "MANUAL"], getValue: (c) => String(c.transmission ?? ""),
        aiGenerate: selectAi("transmission", ["AUTOMATIC", "MANUAL"]) },
    { key: "drivetrain",   label: "Drivetrain",   defaultVisible: false, render: (c) => c.drivetrain ? <span className={styles.badge}>{c.drivetrain}</span> : "—",    editable: true, editType: "select", editOptions: ["FWD", "RWD", "AWD"], getValue: (c) => String(c.drivetrain ?? ""),
        aiGenerate: selectAi("drivetrain", ["FWD", "RWD", "AWD"]) },
    { key: "engineLayout", label: "Engine",       defaultVisible: false, render: (c) => c.engineLayout ? <span className={styles.badge}>{c.engineLayout}</span> : "—", editable: true, editType: "select", editOptions: ["V", "INLINE", "FLAT", "SINGLE_MOTOR", "DUAL_MOTOR"], getValue: (c) => String(c.engineLayout ?? ""),
        aiGenerate: selectAi("engine layout", ["V", "INLINE", "FLAT", "SINGLE_MOTOR", "DUAL_MOTOR"]) },
    { key: "fuel",         label: "Fuel",         defaultVisible: false, render: (c) => c.fuel ? <span className={styles.badge}>{c.fuel}</span> : "—",                editable: true, editType: "select", editOptions: ["GASOLINE", "DIESEL", "ELECTRIC", "HYBRID"], getValue: (c) => String(c.fuel ?? ""),
        aiGenerate: selectAi("fuel type", ["GASOLINE", "DIESEL", "ELECTRIC", "HYBRID"]) },
    { key: "roofType",     label: "Roof",         defaultVisible: false, render: (c) => c.roofType ? <span className={styles.badge}>{c.roofType}</span> : "—",        editable: true, editType: "select", editOptions: ["SOFTTOP", "HARDTOP", "TARGA", "SLICKTOP", "SUNROOF", "PANORAMIC"], getValue: (c) => c.roofType ?? "",
        aiGenerate: selectAi("roof type", ["SOFTTOP", "HARDTOP", "TARGA", "SLICKTOP", "SUNROOF", "PANORAMIC"]) },
    { key: "cylinders",    label: "Cylinders",    defaultVisible: false, render: (c) => c.cylinders ?? "—",  editable: true, editType: "number", getValue: (c) => c.cylinders ?? "", aiGenerate: specAi("cylinder count") },
    { key: "gears",        label: "Gears",        defaultVisible: false, render: (c) => c.gears ?? "—",      editable: true, editType: "number", getValue: (c) => c.gears ?? "",      aiGenerate: specAi("number of gears") },
    { key: "horsepower",   label: "HP",           defaultVisible: false, render: (c) => c.horsepower ?? "—", editable: true, editType: "number", getValue: (c) => c.horsepower ?? "", aiGenerate: specAi("horsepower") },
    { key: "torque",       label: "Torque",       defaultVisible: false, render: (c) => c.torque ?? "—",     editable: true, editType: "number", getValue: (c) => c.torque ?? "",     aiGenerate: specAi("torque in lb-ft") },
    { key: "seats",        label: "Seats",        defaultVisible: false, render: (c) => c.seats ?? "—",      editable: true, editType: "number", getValue: (c) => c.seats ?? "",      aiGenerate: specAi("seat count") },
    { key: "mpg",          label: "MPG",          defaultVisible: false, render: (c) => c.mpg ?? "—",        editable: true, editType: "number", getValue: (c) => c.mpg ?? "",        aiGenerate: specAi("combined MPG fuel economy") },
    { key: "features",     label: "Features",     defaultVisible: false, render: (c) => c.features?.length ? <div className={styles.featurePillsCell}>{c.features.map((f, i) => <span key={f + i} className={styles.featurePill}>{f}</span>)}</div> : <span>—</span>, minWidth: 200, editable: true, editType: "tags", getTagsValue: (c) => c.features ?? [],
        aiGenerate: (c) => callGemini(`List 5–8 features of a ${ctx(c)} as a JSON array. Each feature must be 2–4 words, no punctuation (e.g. ["Heated seats","Apple CarPlay","360° camera"]). Reply with only the JSON array, no extra text.`) },
    { key: "images",       label: "Images",       defaultVisible: false, render: (c) => <span>{c.images?.length ?? 0} image{c.images?.length !== 1 ? "s" : ""}</span>, editable: true, editType: "images", getImagesValue: (c) => c.images ?? [] },
    { key: "description",  label: "Description",  defaultVisible: false, render: (c) => <span className={styles.truncatedCell}>{c.description || "—"}</span>, minWidth: 200, editable: true, editType: "markdown", getValue: (c) => c.description ?? "",
        aiGenerate: (c) => callGemini(`Write a compelling 2-3 paragraph markdown description with titles, subtitles, and maybe bullets for renting a ${ctx(c)} at a luxury car rental company. Highlight performance, comfort, and what makes it special. Use **bold** for emphasis where appropriate. Reply with only the description text in markdown format.`) },
];

// ── Car preview panel ─────────────────────────────────────────────────────────

function CarPreview({ car }: { car: Car }) {
    const [showAll, setShowAll] = useState(false);
    const [panelW, setPanelW] = useState(360);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const obs = new ResizeObserver((entries) => {
            setPanelW(entries[0].contentRect.width);
        });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    const images = car.images ?? [];
    const isNarrow = panelW < 290;
    const showGrid = !isNarrow && images.length > 1;
    const thumbs = images.slice(1, 5);
    const extra = images.length - 5;

    return (
        <div ref={containerRef} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* ── Image gallery ── */}
            {images.length > 0 ? (
                <div style={{
                    position: "relative",
                    display: "flex",
                    gap: 2,
                    height: isNarrow ? 150 : 170,
                    borderRadius: 8,
                    overflow: "hidden",
                    flexShrink: 0,
                    background: "var(--color-primary-dark)",
                }}>
                    {/* Main image */}
                    <img
                        src={images[0]}
                        alt={`${car.make} ${car.model}`}
                        style={{
                            width: showGrid ? "60%" : "100%",
                            height: "100%",
                            objectFit: "cover",
                            flexShrink: 0,
                            display: "block",
                        }}
                    />

                    {/* thumbnail grid — hidden when narrow */}
                    {showGrid && thumbs.length > 0 && (
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: thumbs.length === 1 ? "1fr" : "repeat(2, 1fr)",
                            gridTemplateRows: thumbs.length <= 2 ? "repeat(2, 1fr)" : "repeat(2, 1fr)",
                            width: "40%",
                            gap: 2,
                            flexShrink: 0,
                        }}>
                            {thumbs.map((url, i) => (
                                <img
                                    key={i}
                                    src={url}
                                    alt={`${car.make} ${car.model} ${i + 2}`}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        display: "block",
                                        gridColumn: thumbs.length === 3 && i === 2 ? "1 / -1" : undefined,
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    {/* Overlay button */}
                    {images.length > 1 && (
                        <button
                            onClick={() => setShowAll(true)}
                            style={{
                                position: "absolute",
                                bottom: 8,
                                right: 8,
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                                background: "rgba(0,0,0,0.60)",
                                backdropFilter: "blur(4px)",
                                color: "#fff",
                                border: "1px solid rgba(255,255,255,0.15)",
                                borderRadius: 6,
                                padding: "4px 9px",
                                fontSize: "8pt",
                                fontWeight: 600,
                                cursor: "pointer",
                                lineHeight: 1.4,
                            }}
                        >
                            <BiImages style={{ fontSize: 11 }} />
                            {isNarrow
                                ? "See all images"
                                : extra > 0
                                    ? `+${extra} more`
                                    : `${images.length} photos`}
                        </button>
                    )}
                </div>
            ) : (
                <div style={{
                    height: 130,
                    borderRadius: 8,
                    background: "var(--color-primary-dark)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-foreground-light)",
                    fontSize: "9pt",
                }}>
                    No images
                </div>
            )}

            {/* ── Car info ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: "9pt" }}>
                <div style={{ fontWeight: 700, fontSize: "11pt", color: "var(--color-foreground)" }}>
                    {car.modelYear} {car.make} {car.model}
                </div>
                <div style={{ color: "var(--color-foreground-light)", fontSize: "8pt" }}>{car.vin}</div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 2 }}>
                    {car.vehicleClass && <span className={styles.badge}>{car.vehicleClass}</span>}
                    {car.bodyType && <span className={styles.badge}>{car.bodyType}</span>}
                    {car.transmission && <span className={styles.badge}>{car.transmission}</span>}
                </div>
                <div style={{ color: "var(--color-accent)", fontWeight: 600, fontSize: "10pt", marginTop: 2 }}>
                    ${car.pricePerDay} / day
                </div>
                {car.description && (
                    <div className={styles.previewMarkdown}>
                        <ReactMarkdown>{car.description}</ReactMarkdown>
                    </div>
                )}
            </div>

            {/* ── Full gallery overlay ── */}
            {showAll && createPortal(
                <div style={{
                    position: "fixed",
                    inset: 0,
                    background: "var(--color-primary)",
                    zIndex: 10000,
                    overflowY: "auto",
                    padding: "60px 20px 20px",
                }}>
                    <button
                        onClick={() => setShowAll(false)}
                        style={{
                            position: "fixed",
                            top: 16,
                            right: 16,
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            background: "var(--color-primary-dark)",
                            border: "1px solid var(--color-third)",
                            borderRadius: 8,
                            padding: "6px 14px",
                            color: "var(--color-foreground)",
                            fontSize: "9pt",
                            cursor: "pointer",
                            zIndex: 10001,
                        }}
                    >
                        <BiX /> Close
                    </button>
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: 8,
                        maxWidth: 900,
                        margin: "0 auto",
                    }}>
                        {images.map((url, i) => (
                            <img
                                key={i}
                                src={url}
                                alt={`${car.make} ${car.model} ${i + 1}`}
                                style={{ width: "100%", borderRadius: 8, objectFit: "cover", display: "block" }}
                            />
                        ))}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

// ── Search modes ─────────────────────────────────────────────────────────────

type SearchMode = "search" | "vin";

// ── Panel ────────────────────────────────────────────────────────────────────

const InventoryPanel = () => {
    const { isAdmin, canEdit, canDelete, canAddRow, lockedCols, permanentlyLockedCols } = useTablePermissions("cars");
    const { openEditCar } = useUserDashboardStore();

    // Data
    const [cars, setCars] = useState<Car[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Search
    const [searchMode, setSearchMode] = useState<SearchMode>("search");
    const [query, setQuery] = useState(() => consumePendingJump("view-data") ?? "");
    const [activeSearch, setActiveSearch] = useState("");
    const [vinResult, setVinResult] = useState<Car[] | null>(null);

    // Selection
    const [selected, setSelected] = useState<Set<string | number>>(new Set());
    const [bulkDeleting, setBulkDeleting] = useState(false);

    // Sort
    const [sortBy, setSortBy] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

    // Filters
    const storedFilters = useTablePrefsStore((s) => s.tableFilters[TABLE_TITLE]);
    const storeSetFilters = useTablePrefsStore((s) => s.setTableFilters);
    const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>((storedFilters ?? EMPTY_FILTERS) as ActiveFilter[]);
    const handleFiltersChange = (f: ActiveFilter[]) => { setActiveFilters(f); storeSetFilters(TABLE_TITLE, f); };

    // Makes (fetched for multi-select pill)
    const [makes, setMakes] = useState<string[]>([]);
    useEffect(() => { getFilterBarData().then(({ makes }) => setMakes(makes as string[])); }, []);

    const filterableColumns = useMemo<FilterableColumn[]>(() => [
        { field: "make",         label: "Make",           type: "select", options: makes },
        { field: "model",        label: "Model",          type: "text" },
        { field: "pricePerDay",  label: "Price per day",  type: "number", min: 0, max: 2000 },
        { field: "modelYear",    label: "Model year",     type: "number", min: 1900, max: new Date().getFullYear() },
        { field: "bodyType",     label: "Body type",      type: "select", options: ["SEDAN", "SUV", "TRUCK", "CONVERTIBLE", "HATCHBACK", "FULL_SIZE", "COMPACT", "WAGON", "ELECTRIC", "COUPE"] },
        { field: "vehicleClass", label: "Vehicle class",  type: "select", options: ["ECONOMY", "LUXURY", "PERFORMANCE", "OFFROAD", "FULL_SIZE", "ELECTRIC"] },
        { field: "roofType",     label: "Roof type",      type: "select", options: ["SOFTTOP", "HARDTOP", "TARGA", "SLICKTOP", "SUNROOF", "PANORAMIC"] },
        { field: "fuel",         label: "Fuel",           type: "select", options: ["GASOLINE", "DIESEL", "ELECTRIC", "HYBRID"] },
        { field: "transmission", label: "Transmission",   type: "select", options: ["AUTOMATIC", "MANUAL"] },
        { field: "drivetrain",   label: "Drivetrain",     type: "select", options: ["FWD", "RWD", "AWD"] },
        { field: "engineLayout", label: "Engine layout",  type: "select", options: ["V", "INLINE", "FLAT", "SINGLE_MOTOR", "DUAL_MOTOR"] },
        { field: "horsepower",   label: "Horsepower",     type: "number", min: 0, max: 2000 },
        { field: "torque",       label: "Torque (lb-ft)", type: "number", min: 0, max: 2000 },
        { field: "mpg",          label: "MPG",            type: "number", min: 0, max: 200 },
        { field: "seats",        label: "Seats",          type: "number", min: 1, max: 12 },
        { field: "cylinders",    label: "Cylinders",      type: "number", min: 0, max: 16 },
        { field: "gears",        label: "Gears",          type: "number", min: 1, max: 12 },
        { field: "carStatus",    label: "Status",         type: "select", options: ["AVAILABLE", "DISABLED", "ARCHIVED", "LOANED", "SERVICE"] },
    ], [makes]);

    // Cancel any in-flight fetch when a new one starts
    const fetchIdRef = useRef(0);

    // Fetch paginated list
    const fetchPage = useCallback(async (p: number, ps: number, search: string, sb: string | null, sd: "asc" | "desc", filters: ActiveFilter[] = [], isRefresh = false) => {
        const id = ++fetchIdRef.current;
        if (isRefresh) setRefreshing(true); else setLoading(true);
        setVinResult(null);
        try {
            const params: Record<string, string | number | undefined> = {
                page: p,
                pageSize: ps,
            };
            if (search) params.search = search;
            if (sb) { params.sortBy = sb; params.sortDir = sd; }
            Object.assign(params, filtersToRecord(filters));
            const res = await getCarsFiltered(params);
            if (fetchIdRef.current !== id) return; // stale response
            setCars(res.data);
            setTotalPages(res.totalPages);
            setTotalItems(res.totalItems);
        } catch (e) {
            if (fetchIdRef.current !== id) return;
            alert("Failed to fetch inventory: " + e);
        } finally {
            if (fetchIdRef.current === id) {
                setLoading(false);
                setRefreshing(false);
            }
        }
    }, []);

    // Fetch by VIN
    const fetchByVin = useCallback(async (vin: string) => {
        const id = ++fetchIdRef.current;
        setLoading(true);
        setVinResult(null);
        try {
            const car = await getCarById(vin.trim());
            if (fetchIdRef.current !== id) return;
            setVinResult([car]);
            setCars([car]);
            setTotalPages(1);
            setTotalItems(1);
        } catch {
            if (fetchIdRef.current !== id) return;
            setVinResult([]);
            setCars([]);
            setTotalPages(0);
            setTotalItems(0);
        } finally {
            if (fetchIdRef.current === id) {
                setLoading(false);
            }
        }
    }, []);

    // Initial load
    useEffect(() => { fetchPage(page, pageSize, "", null, "asc", activeFilters); }, []);
    useEffect(() => { setPage(1); fetchPage(1, pageSize, activeSearch, sortBy, sortDir, activeFilters); }, [activeFilters]);

    const handlePageChange = (p: number) => {
        setPage(p);
        setSelected(new Set());
        fetchPage(p, pageSize, activeSearch, sortBy, sortDir, activeFilters);
    };

    const handlePageSizeChange = (ps: number) => {
        setPageSize(ps);
        setPage(1);
        setSelected(new Set());
        fetchPage(1, ps, activeSearch, sortBy, sortDir, activeFilters);
    };

    const handleRefresh = () => {
        if (vinResult !== null && searchMode === "vin" && activeSearch) {
            fetchByVin(activeSearch);
        } else {
            fetchPage(page, pageSize, activeSearch, sortBy, sortDir, activeFilters, true);
        }
    };

    const handleSortChange = (col: string, dir: "asc" | "desc") => {
        setSortBy(col); setSortDir(dir); setPage(1);
        fetchPage(1, pageSize, activeSearch, col, dir, activeFilters);
    };

    const handleSearchSubmit = () => {
        const q = query.trim();
        setActiveSearch(q);
        setPage(1);
        setSelected(new Set());
        if (!q) {
            fetchPage(1, pageSize, "", sortBy, sortDir, activeFilters);
            return;
        }
        if (searchMode === "vin") {
            fetchByVin(q);
        } else {
            fetchPage(1, pageSize, q, sortBy, sortDir, activeFilters);
        }
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSearchSubmit();
    };

    const handleClearSearch = () => {
        setQuery("");
        setActiveSearch("");
        setVinResult(null);
        setPage(1);
        fetchPage(1, pageSize, "", sortBy, sortDir, activeFilters);
    };

    // Bulk delete
    const handleBulkDelete = async () => {
        const vins = [...selected] as string[];
        if (!window.confirm(`Delete ${vins.length} vehicle${vins.length !== 1 ? "s" : ""}? This cannot be undone.`)) return;
        setBulkDeleting(true);
        const results = await Promise.allSettled(vins.map((vin) => deleteCar(vin)));
        const failed = vins.filter((_, i) => results[i].status === "rejected");
        setBulkDeleting(false);
        if (failed.length) alert(`${failed.length} deletion(s) failed.`);
        setSelected(new Set(failed));
        handleRefresh();
    };

    // Single delete
    const handleDeleteOne = async (car: Car) => {
        if (!window.confirm(`Delete vehicle ${car.vin}?`)) return;
        try {
            await deleteCar(car.vin);
            handleRefresh();
        } catch (e) {
            alert("Delete failed: " + e);
        }
    };

    // Edit
    const handleEdit = (car: Car) => openEditCar(car.vin);

    // Create new car row
    const handleCreateRow = async (data: Record<string, string | string[]>) => {
        const s = (k: string) => data[k] as string ?? "";
        const n = (k: string) => Number(data[k] as string) || 0;
        const car: Car = {
            vin:          s("vin"),
            make:         s("make"),
            model:        s("model"),
            modelYear:    Number(s("modelYear")) || new Date().getFullYear(),
            pricePerDay:  n("pricePerDay"),
            vehicleClass: (s("vehicleClass") as Car["vehicleClass"]) || "ECONOMY",
            carStatus:    (s("carStatus") as Car["carStatus"]) || "AVAILABLE",
            bodyType:     s("bodyType"),
            transmission: s("transmission"),
            drivetrain:   s("drivetrain"),
            engineLayout: s("engineLayout"),
            fuel:         s("fuel"),
            roofType:     s("roofType"),
            cylinders:    s("cylinders") ? Number(s("cylinders")) : 0,
            gears:        s("gears") ? Number(s("gears")) : 0,
            horsepower:   s("horsepower") ? Number(s("horsepower")) : 0,
            torque:       s("torque") ? Number(s("torque")) : 0,
            seats:        s("seats") ? Number(s("seats")) : 0,
            mpg:          s("mpg") ? Number(s("mpg")) : 0,
            description:  s("description"),
            features:     (data.features as string[]) ?? [],
            images:       (data.images as string[]) ?? [],
        };
        await addCar(car);
        handleRefresh();
    };

    // Inline edit mode save
    const handleSaveEdits = async (edits: RowEdit<Car>[]) => {
        await Promise.all(edits.map(({ original, patch }) => {
            const { vin: _vin, ...safePatch } = patch as Record<string, unknown>;
            return updateCar({ ...original, ...safePatch } as Car);
        }));
        handleRefresh();
    };

    // Custom search bar with mode dropdown
    const searchBar = (
        <div className={styles.tabPanel}>
            <div className={styles.tabField}>
                <label className={styles.tabLabel}>Search by</label>
                <select
                    className={styles.fieldInput}
                    value={searchMode}
                    onChange={(e) => {
                        setSearchMode(e.target.value as SearchMode);
                        if (query) handleClearSearch();
                    }}
                >
                    <option value="search">Make &amp; Model</option>
                    <option value="vin">VIN</option>
                </select>
            </div>
            <div className={styles.tabField}>
                <label className={styles.tabLabel}>Query</label>
                <input
                    autoFocus
                    className={styles.fieldInput}
                    placeholder={searchMode === "vin" ? "Enter full VIN…" : "Search make, model…"}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                />
            </div>
            <button className={styles.ctxItem} onClick={handleSearchSubmit}>
                <BiSearch /> Search
            </button>
            {activeSearch && (
                <button className={styles.ctxItem} onClick={handleClearSearch}>
                    <BiX /> Clear
                </button>
            )}
        </div>
    );

    return (
        <SpreadsheetTable<Car>
            columns={CAR_COLUMNS}
            data={cars}
            getRowId={(c) => c.vin}
            page={vinResult !== null ? 1 : page}
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
            filterableColumns={filterableColumns}
            activeFilters={activeFilters}
            onFiltersChange={handleFiltersChange}
            title="Cars Database"
            subtitle={activeSearch ? (searchMode === "vin" ? `VIN lookup: ${activeSearch}` : `Search: "${activeSearch}"`) : undefined}
            searchQuery={query}
            onSearchChange={setQuery}
            searchContent={searchBar}
            emptyMessage={searchMode === "vin" && activeSearch ? "No vehicle found with that VIN." : "No vehicles found."}
            onSaveEdits={canEdit ? handleSaveEdits : undefined}
            onCreateRow={canAddRow ? handleCreateRow : undefined}
            aiRequiredFields={["vin", "make", "model", "modelYear"]}
            initialLockedCols={lockedCols}
            permanentlyLockedCols={permanentlyLockedCols}
            sortBy={sortBy}
            sortDir={sortDir}
            onSortChange={handleSortChange}
            renderPreview={(car) => <CarPreview car={car} />}
            getRowLink={(car) => `/car/${car.vin}`}
        />
    );
};

export default InventoryPanel;
