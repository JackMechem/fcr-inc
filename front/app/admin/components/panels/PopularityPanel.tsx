"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useUserDashboardStore } from "@/stores/userDashboardStore";
import { BiRefresh, BiLineChart, BiBarChartAlt2, BiX, BiCircle, BiCalendar, BiListUl, BiChevronDown, BiTable, BiCode, BiImage, BiDockRight, BiFilter, BiDownload } from "react-icons/bi";
import ExportButton from "@/app/admin/components/table/ExportButton";
import CarColorPicker from "./CarColorPicker";
import { downloadData, safeFilename, buildCsv, exportSvg, exportSvgAsPng } from "@/app/admin/components/table/exportUtils";
import { buildQuery } from "@/app/lib/fcr-client/core";
import { FaRegEyeSlash } from "react-icons/fa6";
import tableStyles from "@/app/admin/components/table/spreadsheetTable.module.css";
import BrowseFilterPanel from "@/app/admin/components/table/BrowseFilterPanel";
import OptionsSidePanel from "@/app/admin/components/table/OptionsSidePanel";
import { type ActiveFilter, type FilterableColumn, formatFilterLabel, filtersToRecord } from "@/app/admin/components/table/FilterPanel";
import { getFilterBarData } from "@/app/browse/actions";
import s from "./PopularityPanel.module.css";

// ── Types ──────────────────────────────────────────────────────────────────────

interface PopularityCar {
    vin: string;
    make: string;
    model: string;
    modelYear?: number;
    [key: string]: unknown;
}

interface PopularityEntry {
    car: PopularityCar;
    timeUnit: number;
    date: string;
    popularity: number;
}

type TimeUnit = "day" | "week" | "month" | "year";
type ChartMode = "per-car-per-time" | "per-car" | "per-time";
type OpenMenu = "daterange" | null;

const CHART_MODE_LABELS: Record<ChartMode, string> = {
    "per-car-per-time": "Reservations per car over time",
    "per-car":          "Reservations per car",
    "per-time":         "Reservations in a time range",
};

const CHART_MODE_ICONS: Record<ChartMode, React.ReactNode> = {
    "per-car-per-time": <BiLineChart />,
    "per-car":          <BiBarChartAlt2 />,
    "per-time":         <BiLineChart />,
};

// Mini demo SVGs for the chart mode picker
const CHART_MODE_PREVIEWS: Record<ChartMode, React.ReactNode> = {
    "per-car-per-time": (
        <svg viewBox="0 0 120 72" width="120" height="72" style={{ display: "block" }}>
            <defs>
                <linearGradient id="pm-g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e53e3e" stopOpacity="0.18"/><stop offset="100%" stopColor="#e53e3e" stopOpacity="0"/></linearGradient>
                <linearGradient id="pm-g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity="0.14"/><stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/></linearGradient>
                <linearGradient id="pm-g3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity="0.14"/><stop offset="100%" stopColor="#10b981" stopOpacity="0"/></linearGradient>
            </defs>
            <path d="M6,58 C22,50 34,28 55,18 C74,9 90,32 114,14 L114,64 L6,64 Z" fill="url(#pm-g1)" />
            <path d="M6,58 C22,50 34,28 55,18 C74,9 90,32 114,14" fill="none" stroke="#e53e3e" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6,62 C20,56 38,44 55,38 C72,32 88,46 114,36" fill="none" stroke="#3b82f6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6,60 C18,52 36,55 55,46 C72,38 90,52 114,48" fill="none" stroke="#10b981" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            <line x1={6} x2={114} y1={64} y2={64} stroke="currentColor" strokeOpacity={0.12} strokeWidth={1} />
        </svg>
    ),
    "per-car": (
        <svg viewBox="0 0 120 72" width="120" height="72" style={{ display: "block" }}>
            <defs>
                {["#e53e3e","#3b82f6","#10b981","#f59e0b","#8b5cf6"].map((c, i) => (
                    <linearGradient key={i} id={`pm-b${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={c} stopOpacity="0.9"/>
                        <stop offset="100%" stopColor={c} stopOpacity="0.6"/>
                    </linearGradient>
                ))}
            </defs>
            {[
                { x: 8,  h: 44, i: 0 },
                { x: 28, h: 26, i: 1 },
                { x: 48, h: 52, i: 2 },
                { x: 68, h: 18, i: 3 },
                { x: 88, h: 36, i: 4 },
            ].map(({ x, h, i }) => (
                <rect key={x} x={x} y={64 - h} width={18} height={h} fill={`url(#pm-b${i})`} rx={3} />
            ))}
            <line x1={6} x2={114} y1={64} y2={64} stroke="currentColor" strokeOpacity={0.12} strokeWidth={1} />
        </svg>
    ),
    "per-time": (
        <svg viewBox="0 0 120 72" width="120" height="72" style={{ display: "block" }}>
            <defs>
                <linearGradient id="pm-t1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e53e3e" stopOpacity="0.22"/><stop offset="100%" stopColor="#e53e3e" stopOpacity="0"/></linearGradient>
            </defs>
            <path d="M6,60 C20,52 32,36 50,24 C66,13 82,30 114,16 L114,64 L6,64 Z" fill="url(#pm-t1)" />
            <path d="M6,60 C20,52 32,36 50,24 C66,13 82,30 114,16" fill="none" stroke="#e53e3e" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            {[6, 34, 62, 90, 114].map((x) => <line key={x} x1={x} x2={x} y1={62} y2={64} stroke="currentColor" strokeOpacity={0.2} strokeWidth={1} />)}
            <line x1={6} x2={114} y1={64} y2={64} stroke="currentColor" strokeOpacity={0.12} strokeWidth={1} />
        </svg>
    ),
};

function buildFilterableColumns(makes: string[]): FilterableColumn[] {
    return [
        { field: "search",       label: "Search",         type: "text" },
        { field: "make",         label: "Make",           type: "select", options: makes },
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
    ];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

// Curated palette of vivid, perceptually distinct colors for dark backgrounds
const CHART_PALETTE = [
    "#f87171", "#60a5fa", "#34d399", "#fbbf24", "#a78bfa",
    "#f472b6", "#22d3ee", "#a3e635", "#fb923c", "#818cf8",
    "#2dd4bf", "#e879f9", "#facc15", "#4ade80", "#38bdf8",
    "#f43f5e", "#c084fc", "#fb7185", "#86efac", "#93c5fd",
    "#fda4af", "#6ee7b7",
];

function chartColor(index: number): string {
    return CHART_PALETTE[index % CHART_PALETTE.length];
}

function toISOLocal(date: Date): string {
    return date.toISOString();
}

function defaultStartDate(): string {
    const d = new Date();
    d.setMonth(d.getMonth() - 4);
    return d.toISOString().slice(0, 10);
}

function defaultEndDate(): string {
    return new Date().toISOString().slice(0, 10);
}

function carLabel(car: PopularityCar | undefined): string {
    if (!car) return "All";
    return `${car.modelYear ? car.modelYear + " " : ""}${car.make} ${car.model}`;
}

function truncateLabel(text: string, maxLen = 18): string {
    return text.length > maxLen ? text.slice(0, maxLen - 1) + "…" : text;
}

function groupByCar(entries: PopularityEntry[]): Map<string, PopularityEntry[]> {
    const map = new Map<string, PopularityEntry[]>();
    for (const entry of entries) {
        const vin = entry.car?.vin ?? "__all__";
        if (!map.has(vin)) map.set(vin, []);
        map.get(vin)!.push(entry);
    }
    for (const [, series] of map) {
        series.sort((a, b) => a.date.localeCompare(b.date));
    }
    return map;
}

function allDates(seriesMap: Map<string, PopularityEntry[]>): string[] {
    const set = new Set<string>();
    for (const [, entries] of seriesMap) {
        for (const e of entries) if (e.date) set.add(e.date);
    }
    return [...set].sort();
}

// ── Date-range generation ──────────────────────────────────────────────────────

function getMySQLWeekU(date: Date): number {
    const yearStart = new Date(date.getFullYear(), 0, 1);
    const dayOfYear = Math.round((date.getTime() - yearStart.getTime()) / 86400000);
    return Math.floor((dayOfYear + yearStart.getDay()) / 7);
}

function fmtDay(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}
function fmtWeek(d: Date): string {
    return `${d.getFullYear()}-${String(getMySQLWeekU(d)).padStart(2, "0")}`;
}
function fmtMonth(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function detectFormat(apiDates: string[], timeUnit: TimeUnit | ""): TimeUnit {
    if (timeUnit) return timeUnit;
    if (apiDates.length === 0) return "month";
    const sample = apiDates[0];
    if (/^\d{4}$/.test(sample)) return "year";
    if (/^\d{4}-\d{2}-\d{2}$/.test(sample)) return "day";
    const maxN = Math.max(...apiDates.map((d) => parseInt((d ?? "").split("-")[1] ?? "0")));
    return maxN > 12 ? "week" : "month";
}

function generateDateRange(startStr: string, endStr: string, fmt: TimeUnit): string[] {
    const start = new Date(startStr + "T00:00:00");
    const end   = new Date(endStr   + "T23:59:59");
    const out: string[] = [];

    if (fmt === "day") {
        const cur = new Date(start);
        while (cur <= end) { out.push(fmtDay(cur)); cur.setDate(cur.getDate() + 1); }
    } else if (fmt === "week") {
        const cur = new Date(start);
        cur.setDate(cur.getDate() - cur.getDay());
        while (cur <= end) { out.push(fmtWeek(cur)); cur.setDate(cur.getDate() + 7); }
    } else if (fmt === "month") {
        const cur = new Date(start.getFullYear(), start.getMonth(), 1);
        const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
        while (cur <= endMonth) { out.push(fmtMonth(cur)); cur.setMonth(cur.getMonth() + 1); }
    } else {
        for (let y = start.getFullYear(); y <= end.getFullYear(); y++) out.push(String(y));
    }

    return [...new Set(out)];
}

// ── Chart helpers ──────────────────────────────────────────────────────────────

function computeYTicks(maxVal: number): number[] {
    if (maxVal <= 0) return [0];
    // Aim for ~5 ticks, step always an integer >= 1
    const rawStep = maxVal / 5;
    const mag = Math.pow(10, Math.floor(Math.log10(Math.max(rawStep, 1))));
    const n   = rawStep / mag;
    const niceStep = Math.max(1, n <= 1 ? mag : n <= 2 ? mag * 2 : n <= 5 ? mag * 5 : mag * 10);
    const ticks: number[] = [];
    for (let v = 0; v <= maxVal * 1.001 + niceStep; v += niceStep) {
        ticks.push(Math.round(v));
        if (ticks.length >= 7) break;
    }
    return ticks;
}

// Catmull-Rom spline → SVG cubic bezier path.
// - Zero-to-zero segments use straight L lines (no spline, no artifacts, all overlap cleanly at baseline)
// - Non-zero segments use smooth cubic bezier
// - Clamps y control points so curve never dips below yFloor (the zero line)
// - Clamps x control points within segment bounds to prevent backward loops
function catmullRomPath(pts: [number, number][], yFloor: number): string {
    if (pts.length === 0) return "";
    const cy      = (y: number) => Math.min(y, yFloor);
    const atFloor = (y: number) => y >= yFloor - 0.5;
    let d = `M ${pts[0][0].toFixed(1)} ${cy(pts[0][1]).toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
        const p1 = pts[i];
        const p2 = pts[i + 1];
        if (atFloor(p1[1]) && atFloor(p2[1])) {
            d += ` L ${p2[0].toFixed(1)} ${yFloor.toFixed(1)}`;
            continue;
        }
        const p0 = pts[Math.max(0, i - 1)];
        const p3 = pts[Math.min(pts.length - 1, i + 2)];
        const cp1x = Math.max(p1[0], Math.min(p2[0], p1[0] + (p2[0] - p0[0]) / 6));
        const cp1y = cy(p1[1] + (p2[1] - p0[1]) / 6);
        const cp2x = Math.max(p1[0], Math.min(p2[0], p2[0] - (p3[0] - p1[0]) / 6));
        const cp2y = cy(p2[1] - (p3[1] - p1[1]) / 6);
        d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)} ${cp2x.toFixed(1)} ${cp2y.toFixed(1)} ${p2[0].toFixed(1)} ${cy(p2[1]).toFixed(1)}`;
    }
    return d;
}

// ── Tooltip ────────────────────────────────────────────────────────────────────

interface TooltipPayloadItem {
    vin: string;
    name: string;
    value: number;
    color: string;
}

function ChartTooltip({ payload, label, mouseX, mouseY }: {
    payload: TooltipPayloadItem[];
    label: string;
    mouseX: number;
    mouseY: number;
}) {
    if (!payload.length) return null;
    const sorted = [...payload].sort((a, b) => b.value - a.value);
    const flipX = mouseX > window.innerWidth - 200;
    return (
        <div
            className={s.tooltip}
            style={{
                position: "fixed",
                left: flipX ? mouseX - 16 : mouseX + 16,
                top: mouseY,
                transform: flipX ? "translate(-100%, -50%)" : "translateY(-50%)",
                pointerEvents: "none",
                zIndex: 99999,
            }}
        >
            <div className={s.tooltipLabel}>{label}</div>
            {sorted.map((item) => (
                <div key={item.vin} className={s.tooltipRow}>
                    <span className={s.tooltipDot} style={{ background: item.color }} />
                    <span className={s.tooltipCar}>{item.name}</span>
                    <span className={s.tooltipPop}>{item.value}</span>
                </div>
            ))}
        </div>
    );
}

// ── Custom SVG Line Chart ──────────────────────────────────────────────────────

interface LineChartProps {
    seriesMap: Map<string, PopularityEntry[]>;
    dates: string[];
    colors: Map<string, string>;
    visibleVins: Set<string>;
}

const MARGIN = { top: 8, right: 16, bottom: 64, left: 36 };

function LineChart({ seriesMap, dates, colors, visibleVins }: LineChartProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef       = useRef<SVGSVGElement>(null);
    const [size, setSize]       = useState({ width: 0, height: 0 });
    const [hoverIdx, setHoverIdx] = useState<number | null>(null);
    const [hoverChartPos, setHoverChartPos] = useState<{ x: number; y: number } | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [zoom, setZoom]         = useState({ scaleX: 1, panX: 0, scaleY: 1 });
    const [dragging, setDragging] = useState(false);

    // Refs so event handlers always see current values without stale closures
    const zoomRef      = useRef(zoom);     zoomRef.current = zoom;
    const isDragging   = useRef(false);
    const dragStartX   = useRef(0);
    const dragStartPan = useRef(0);
    const innerWRef    = useRef(0);
    const lastMxRef    = useRef(0);   // last cursor X in inner-chart coords (set by mousemove)

    // Measure container
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver(() => setSize({ width: el.clientWidth, height: el.clientHeight }));
        ro.observe(el);
        setSize({ width: el.clientWidth, height: el.clientHeight });
        return () => ro.disconnect();
    }, []);

    // Reset zoom only when the date range changes, not when visibility changes
    useEffect(() => { setZoom({ scaleX: 1, panX: 0, scaleY: 1 }); }, [dates.join(",")]);

    // Non-passive wheel listener (React synthetic events can't preventDefault reliably)
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const handler = (e: WheelEvent) => {
            e.preventDefault();
            const factor = e.deltaY < 0 ? 1.2 : 1 / 1.2;
            if (e.shiftKey) {
                const { scaleY } = zoomRef.current;
                const newScaleY = Math.max(0.05, Math.min(20, scaleY * factor));
                setZoom(prev => ({ ...prev, scaleY: newScaleY }));
            } else {
                const mx              = lastMxRef.current;
                const iW              = innerWRef.current;
                const { scaleX, panX } = zoomRef.current;
                const newScaleX       = Math.max(1, scaleX * factor);
                // Keep the data point under the cursor fixed: mx = xBase*scaleX + panX  →  newPanX = mx - (mx - panX)*(newScaleX/scaleX)
                const rawPanX         = mx - (mx - panX) * (newScaleX / scaleX);
                const clampedPanX     = Math.min(0, Math.max(iW * (1 - newScaleX), rawPanX));
                setZoom(prev => ({ ...prev, scaleX: newScaleX, panX: clampedPanX }));
            }
        };
        el.addEventListener("wheel", handler, { passive: false });
        return () => el.removeEventListener("wheel", handler);
    }, []);

    // Global mouseup ends pan even if cursor leaves the SVG
    useEffect(() => {
        const onUp = () => {
            if (!isDragging.current) return;
            isDragging.current = false;
            setDragging(false);
        };
        window.addEventListener("mouseup", onUp);
        return () => window.removeEventListener("mouseup", onUp);
    }, []);

    const visibleSeries = useMemo(
        () => [...seriesMap.entries()].filter(([vin]) => visibleVins.has(vin)),
        [seriesMap, visibleVins]
    );

    const chartData = useMemo(() => dates.map((date) => {
        const row: Record<string, number> = {};
        for (const [vin, entries] of visibleSeries) {
            const entry = entries.find((e) => e.date === date);
            row[vin] = entry?.popularity ?? 0;
        }
        return row;
    }), [dates, visibleSeries]);

    if (dates.length === 0 || visibleSeries.length === 0) {
        return <div className={s.chartEmpty}>No data to display</div>;
    }

    const { width, height } = size;
    const innerW = Math.max(0, width  - MARGIN.left - MARGIN.right);
    const innerH = Math.max(0, height - MARGIN.top  - MARGIN.bottom);
    innerWRef.current = innerW;

    // Use ALL series for Y scale so hiding/soloing cars never rescales the axis
    const allValues = [...seriesMap.values()].flatMap(entries => entries.map(e => e.popularity));
    const maxVal     = Math.max(...allValues, 1);
    const yMaxShown  = maxVal / zoom.scaleY;           // larger when zoomed out, smaller when zoomed in
    const yTicks     = computeYTicks(yMaxShown);
    const yMax       = yTicks[yTicks.length - 1];

    // Zoomed x position for data index i
    const xBase   = (i: number) => dates.length <= 1 ? innerW / 2 : (i / (dates.length - 1)) * innerW;
    const xScaled = (i: number) => xBase(i) * zoom.scaleX + zoom.panX;
    const yScale  = (v: number) => innerH - (v / yMax) * innerH;

    // Only render x-labels that are currently within the visible area
    const visibleXIndices = dates.map((_, i) => i).filter(i => {
        const x = xScaled(i);
        return x >= -20 && x <= innerW + 20;
    });

    // Mouse handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        isDragging.current  = true;
        setDragging(true);
        dragStartX.current  = e.clientX;
        dragStartPan.current = zoomRef.current.panX;
        setHoverIdx(null);
    };

    const handleMouseMove = (e: React.MouseEvent<SVGRectElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const mx   = e.clientX - rect.left;
        const my   = e.clientY - rect.top;
        lastMxRef.current = mx;
        if (isDragging.current) {
            const dx      = e.clientX - dragStartX.current;
            const { scaleX } = zoomRef.current;
            const rawPan  = dragStartPan.current + dx;
            const clamped = Math.min(0, Math.max(innerW * (1 - scaleX), rawPan));
            setZoom(prev => ({ ...prev, panX: clamped }));
        } else {
            setHoverChartPos({ x: mx, y: my });
            const { scaleX, panX } = zoomRef.current;
            const rawIdx = ((mx - panX) / (innerW * scaleX)) * (dates.length - 1);
            setHoverIdx(Math.max(0, Math.min(dates.length - 1, Math.round(rawIdx))));
            setMousePos({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseLeave = () => {
        if (!isDragging.current) { setHoverIdx(null); setHoverChartPos(null); }
    };

    const handleDoubleClick = () => setZoom({ scaleX: 1, panX: 0, scaleY: 1 });

    const cursor = dragging ? "grabbing" : zoom.scaleX > 1 ? "grab" : "crosshair";

    const tooltipItems: TooltipPayloadItem[] = hoverIdx !== null && !dragging
        ? visibleSeries.map(([vin, entries]) => ({
            vin,
            name: entries[0]?.car ? carLabel(entries[0].car) : vin,
            value: chartData[hoverIdx][vin],
            color: colors.get(vin) ?? "#888",
        })).filter(item => item.value !== 0)
        : [];

    return (
        <div ref={containerRef} className={s.chartContainer}>
            {width > 0 && height > 0 && (
                <svg ref={svgRef} width={width} height={height} className={s.chartSvg} style={{ cursor }}>
                    <defs>
                        <clipPath id="chart-area-clip">
                            <rect x={0} y={0} width={innerW} height={innerH} />
                        </clipPath>
                    </defs>
                    <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
                        {/* Grid + Y labels (fixed — not clipped) */}
                        {yTicks.map((v) => (
                            <g key={v}>
                                <line x1={0} x2={innerW} y1={yScale(v)} y2={yScale(v)}
                                    stroke="var(--color-third)" strokeDasharray="3,3" strokeWidth={1} />
                                <text x={-6} y={yScale(v)} textAnchor="end" dominantBaseline="middle"
                                    fill="var(--color-foreground-light)" fontSize={10}>{v}</text>
                            </g>
                        ))}
                        {/* X labels — only visible ones, rotated */}
                        {visibleXIndices.map((i) => (
                            <text key={dates[i]} textAnchor="end"
                                transform={`translate(${xScaled(i)},${innerH + 8}) rotate(-45)`}
                                fill="var(--color-foreground-light)" fontSize={10}>{dates[i]}</text>
                        ))}
                        {/* Scale indicators */}
                        {(zoom.scaleX !== 1 || zoom.scaleY !== 1) && (() => {
                            const badges: { label: string }[] = [];
                            if (zoom.scaleX !== 1) badges.push({ label: `↔ ${zoom.scaleX.toFixed(1)}×` });
                            if (zoom.scaleY !== 1) badges.push({ label: `↕ ${zoom.scaleY.toFixed(2)}×` });
                            const bw = 64, bh = 17, gap = 4;
                            const totalW = badges.length * bw + (badges.length - 1) * gap;
                            return (
                                <g>
                                    {badges.map((b, i) => (
                                        <g key={b.label} transform={`translate(${innerW - totalW + i * (bw + gap)}, 2)`}>
                                            <rect width={bw} height={bh} rx={4}
                                                fill="var(--color-primary)" stroke="var(--color-third)" strokeWidth={1} />
                                            <text x={bw / 2} y={bh / 2 + 1} textAnchor="middle" dominantBaseline="middle"
                                                fill="var(--color-foreground-light)" fontSize={10}>{b.label}</text>
                                        </g>
                                    ))}
                                </g>
                            );
                        })()}
                        {/* Clipped data area */}
                        <g clipPath="url(#chart-area-clip)">
                            {/* Series splines */}
                            {visibleSeries.map(([vin]) => {
                                const color = colors.get(vin) ?? "#888";
                                const pts: [number, number][] = chartData.map((d, i) => [xScaled(i), yScale(d[vin])]);
                                return (
                                    <path key={vin} d={catmullRomPath(pts, innerH)} fill="none"
                                        stroke={color} strokeWidth={2.5}
                                        strokeLinejoin="round" strokeLinecap="round" />
                                );
                            })}
                            {/* Dots snapped to nearest data point */}
                            {hoverIdx !== null && !dragging && visibleSeries.map(([vin]) => (
                                <circle key={vin}
                                    cx={xScaled(hoverIdx)} cy={yScale(chartData[hoverIdx][vin])}
                                    r={4} fill={colors.get(vin) ?? "#888"}
                                    stroke="var(--color-primary)" strokeWidth={2} />
                            ))}
                        </g>
                        {/* Crosshair — exact cursor position, drawn above data but below capture rect */}
                        {hoverChartPos && !dragging && (
                            <>
                                <line x1={hoverChartPos.x} x2={hoverChartPos.x} y1={0} y2={innerH}
                                    stroke="var(--color-foreground-light)" strokeWidth={1}
                                    strokeDasharray="4,2" opacity={0.5} />
                                <line x1={0} x2={innerW} y1={hoverChartPos.y} y2={hoverChartPos.y}
                                    stroke="var(--color-foreground-light)" strokeWidth={1}
                                    strokeDasharray="4,2" opacity={0.5} />
                            </>
                        )}
                        {/* Mouse-capture rect */}
                        <rect x={0} y={0} width={innerW} height={innerH} fill="transparent"
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                            onDoubleClick={handleDoubleClick}
                        />
                    </g>
                </svg>
            )}
            {hoverIdx !== null && !dragging && tooltipItems.length > 0 && typeof document !== "undefined" && createPortal(
                <ChartTooltip payload={tooltipItems} label={dates[hoverIdx]} mouseX={mousePos.x} mouseY={mousePos.y} />,
                document.body
            )}
        </div>
    );
}

// ── SVG Bar Chart (groupByCar=true, groupByTime=false) ────────────────────────

interface BarChartProps {
    carTotals: Map<string, { car: PopularityCar; total: number }>;
    sortedVins: string[];
    colors: Map<string, string>;
    visibleVins: Set<string>;
}

const BAR_MARGIN = { top: 16, right: 16, bottom: 96, left: 40 };

function BarChart({ carTotals, sortedVins, colors, visibleVins }: BarChartProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ width: 0, height: 0 });
    const [hoverVin, setHoverVin] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver(() => setSize({ width: el.clientWidth, height: el.clientHeight }));
        ro.observe(el);
        setSize({ width: el.clientWidth, height: el.clientHeight });
        return () => ro.disconnect();
    }, []);

    const visibleVinList = sortedVins.filter((v) => visibleVins.has(v));

    if (visibleVinList.length === 0) return <div className={s.chartEmpty}>No data to display</div>;

    const { width, height } = size;
    const innerW = Math.max(0, width  - BAR_MARGIN.left - BAR_MARGIN.right);

    const gap = Math.max(2, innerW * 0.08 / visibleVinList.length);
    const barW = Math.max(4, (innerW - gap * (visibleVinList.length + 1)) / visibleVinList.length);
    const showXLabels = barW >= 20;

    const bottomMargin = showXLabels ? BAR_MARGIN.bottom : 24;
    const innerH = Math.max(0, height - BAR_MARGIN.top  - bottomMargin);

    const maxVal = Math.max(...visibleVinList.map((v) => carTotals.get(v)?.total ?? 0), 1);
    const yTicks = computeYTicks(maxVal);
    const yMax   = yTicks[yTicks.length - 1];
    const yScale = (v: number) => innerH - (v / yMax) * innerH;

    const xPos = (i: number) => gap + i * (barW + gap);

    return (
        <div ref={containerRef} className={s.chartContainer}>
            {width > 0 && height > 0 && (
                <svg width={width} height={height} className={s.chartSvg}>
                    <g transform={`translate(${BAR_MARGIN.left},${BAR_MARGIN.top})`}>
                        {/* Y grid + labels */}
                        {yTicks.map((v) => (
                            <g key={v}>
                                <line x1={0} x2={innerW} y1={yScale(v)} y2={yScale(v)}
                                    stroke="var(--color-third)" strokeDasharray="3,3" strokeWidth={1} />
                                <text x={-6} y={yScale(v)} textAnchor="end" dominantBaseline="middle"
                                    fill="var(--color-foreground-light)" fontSize={10}>{v}</text>
                            </g>
                        ))}
                        {/* Bars */}
                        {visibleVinList.map((vin, i) => {
                            const total = carTotals.get(vin)?.total ?? 0;
                            const color = colors.get(vin) ?? "#888";
                            const x = xPos(i);
                            const barH = Math.max(0, innerH - yScale(total));
                            const isHovered = hoverVin === vin;
                            return (
                                <g key={vin}
                                    onMouseEnter={(e) => { setHoverVin(vin); setMousePos({ x: e.clientX, y: e.clientY }); }}
                                    onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
                                    onMouseLeave={() => setHoverVin(null)}
                                    style={{ cursor: "default" }}
                                >
                                    <rect
                                        x={x} y={yScale(total)} width={barW} height={barH}
                                        fill={color} opacity={isHovered ? 1 : 0.8}
                                        rx={2}
                                    />
                                    {/* X-axis label */}
                                    {showXLabels && (
                                        <text
                                            transform={`translate(${x + barW / 2},${innerH + 8}) rotate(-45)`}
                                            textAnchor="end" fill="var(--color-foreground-light)" fontSize={10}
                                        >
                                            {truncateLabel(carLabel(carTotals.get(vin)!.car))}
                                        </text>
                                    )}
                                </g>
                            );
                        })}
                        {/* Baseline */}
                        <line x1={0} x2={innerW} y1={innerH} y2={innerH}
                            stroke="var(--color-third)" strokeWidth={1} />
                    </g>
                </svg>
            )}
            {hoverVin !== null && typeof document !== "undefined" && createPortal(
                <ChartTooltip
                    payload={[{ vin: hoverVin, name: carLabel(carTotals.get(hoverVin)!.car), value: carTotals.get(hoverVin)!.total, color: colors.get(hoverVin) ?? "#888" }]}
                    label=""
                    mouseX={mousePos.x}
                    mouseY={mousePos.y}
                />,
                document.body
            )}
        </div>
    );
}

// ── Popup menu positioning helper ──────────────────────────────────────────────

function getMenuPos(btn: HTMLElement | null): { top: number; right: number } {
    if (!btn) return { top: 48, right: 8 };
    const rect = btn.getBoundingClientRect();
    return { top: rect.bottom + 4, right: window.innerWidth - rect.right };
}

// ── Main Panel ─────────────────────────────────────────────────────────────────

export default function PopularityPanel() {
    const { sessionToken } = useUserDashboardStore();

    const [startDate, setStartDate] = useState(defaultStartDate);
    const [endDate, setEndDate] = useState(defaultEndDate);
    const [timeUnit, setTimeUnit] = useState<TimeUnit | "">("");
    const [chartMode, setChartMode] = useState<ChartMode>("per-car-per-time");
    const groupByCarOn  = chartMode !== "per-time";
    const groupByTimeOn = chartMode !== "per-car";
    const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
    const [panelOpen, setPanelOpen] = useState(false);
    const [panelTab, setPanelTab] = useState("daterange");
    const [panelWidth, setPanelWidth] = useState(280);

    // Makes (fetched for multi-select pill)
    const [makes, setMakes] = useState<string[]>([]);
    useEffect(() => { getFilterBarData().then(({ makes }) => setMakes(makes as string[])); }, []);
    const filterableColumns = useMemo(() => buildFilterableColumns(makes), [makes]);

    const [entries, setEntries] = useState<PopularityEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mutedVins, setMutedVins] = useState<Set<string>>(new Set());
    const [soloedVins, setSoloedVins] = useState<Set<string>>(new Set());
    const [colorOverrides, setColorOverrides] = useState<Map<string, string>>(new Map());
    const [colorPickerVin, setColorPickerVin] = useState<string | null>(null);
    const [colorPickerPos, setColorPickerPos] = useState({ top: 0, left: 0 });
    const chartAreaRef = useRef<HTMLDivElement>(null);

    const [chartModeOpen, setChartModeOpen] = useState(false);
    const [chartModePos, setChartModePos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
    const chartModeBtnRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!chartModeOpen) return;
        const handler = (e: MouseEvent) => {
            const target = e.target as Node;
            const insideMenu = (document.querySelector("[data-chartmode-menu]") as HTMLElement | null)?.contains(target);
            if (!insideMenu && !chartModeBtnRef.current?.contains(target)) setChartModeOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [chartModeOpen]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params: Record<string, string> = {
                groupByCar: groupByCarOn ? "true" : "false",
                groupByTime: groupByTimeOn ? "true" : "false",
                select: "vin,make,model,modelYear",
            };
            if (startDate) params.popularityStartDate = toISOLocal(new Date(startDate + "T00:00:00"));
            if (endDate) params.popularityEndDate = toISOLocal(new Date(endDate + "T23:59:59"));
            if (timeUnit) params.timeUnit = timeUnit;
            const filterParams = filtersToRecord(activeFilters);
            for (const [k, v] of Object.entries(filterParams)) {
                if (v !== undefined) params[k] = String(v);
            }

            const qs = buildQuery(params);
            const res = await fetch(`/api/stats/popularity?${qs}`, {
                headers: sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {},
                cache: "no-store",
            });
            if (!res.ok) throw new Error(`Request failed (${res.status})`);
            const data: PopularityEntry[] = await res.json();
            setEntries(Array.isArray(data) ? data : []);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load data");
            setEntries([]);
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate, timeUnit, chartMode, activeFilters, sessionToken]);

    useEffect(() => { if (chartMode === "per-car") setTimeUnit(""); }, [chartMode]);
    useEffect(() => { fetchData(); }, [fetchData]);

    const seriesMap = groupByCar(entries);

    // When groupByCarOn is false, collapse all series into one aggregate line
    const effectiveSeriesMap: Map<string, PopularityEntry[]> = useMemo(() => {
        if (groupByCarOn) return seriesMap;
        const byDate = new Map<string, number>();
        for (const [, series] of seriesMap) {
            for (const e of series) byDate.set(e.date, (byDate.get(e.date) ?? 0) + e.popularity);
        }
        const agg: PopularityEntry[] = [...byDate.entries()]
            .map(([date, popularity]) => ({ car: { vin: "__all__", make: "All", model: "Cars" }, timeUnit: 0, date, popularity }))
            .sort((a, b) => a.date.localeCompare(b.date));
        return new Map([["__all__", agg]]);
    }, [seriesMap, groupByCarOn]);

    const apiDates = allDates(effectiveSeriesMap);
    const fmt = detectFormat(apiDates, timeUnit);
    const rangeDates = startDate && endDate ? generateDateRange(startDate, endDate, fmt) : apiDates;
    const dates = [...new Set([...rangeDates, ...apiDates])].sort();

    const carTotals = new Map<string, { car: PopularityCar; total: number }>();
    for (const [vin, series] of effectiveSeriesMap) {
        carTotals.set(vin, { car: series[0].car, total: series.reduce((sum, e) => sum + e.popularity, 0) });
    }
    const sortedVins = [...carTotals.keys()].sort(
        (a, b) => (carTotals.get(b)?.total ?? 0) - (carTotals.get(a)?.total ?? 0)
    );
    const colorMap = new Map<string, string>(
        sortedVins.map((vin, i) => [vin, chartColor(i)])
    );
    const effectiveColorMap = new Map(colorMap);
    for (const [vin, color] of colorOverrides) {
        if (effectiveColorMap.has(vin)) effectiveColorMap.set(vin, color);
    }

    useEffect(() => {
        setMutedVins(new Set());
        setSoloedVins(new Set());
        setColorOverrides(new Map());
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entries]);

    const visibleVins: Set<string> = soloedVins.size > 0
        ? soloedVins
        : new Set(sortedVins.filter((v) => !mutedVins.has(v)));

    const toggleMute = (vin: string) => {
        setMutedVins((prev) => { const n = new Set(prev); n.has(vin) ? n.delete(vin) : n.add(vin); return n; });
        setSoloedVins((prev) => { const n = new Set(prev); n.delete(vin); return n; });
    };
    const toggleSolo = (vin: string) => {
        setSoloedVins((prev) => { const n = new Set(prev); n.has(vin) ? n.delete(vin) : n.add(vin); return n; });
        setMutedVins((prev) => { const n = new Set(prev); n.delete(vin); return n; });
    };

    const hasFilters = activeFilters.length > 0;

    const panelFilename = (ext: string) => safeFilename("reservations", ext);

    const exportOptions = [
        {
            label: "PNG",
            sub: "Download chart as image",
            icon: <BiImage />,
            onClick: async () => {
                const svgEl = chartAreaRef.current?.querySelector<SVGSVGElement>("svg");
                if (svgEl) await exportSvgAsPng(svgEl, panelFilename("png"));
            },
            disabled: loading || entries.length === 0,
        },
        {
            label: "SVG",
            sub: "Download as vector graphic",
            icon: <BiImage />,
            onClick: () => {
                const svgEl = chartAreaRef.current?.querySelector<SVGSVGElement>("svg");
                if (svgEl) exportSvg(svgEl, panelFilename("svg"));
            },
            disabled: loading || entries.length === 0,
        },
        {
            label: "CSV",
            sub: "Download data as .csv",
            icon: <BiTable />,
            onClick: () => {
                const headers = groupByCarOn
                    ? ["Car", "VIN", "Date", "Reservations"]
                    : ["Date", "Reservations"];
                const rows = entries.map(e => groupByCarOn
                    ? [carLabel(e.car), e.car?.vin ?? "", e.date, e.popularity]
                    : [e.date, e.popularity]
                );
                downloadData(buildCsv(headers, rows), "text/csv;charset=utf-8;", panelFilename("csv"));
            },
            disabled: entries.length === 0,
            divider: true,
        },
        {
            label: "JSON",
            sub: "Download data as .json",
            icon: <BiCode />,
            onClick: () => downloadData(JSON.stringify(entries, null, 2), "application/json", panelFilename("json")),
            disabled: entries.length === 0,
        },
    ];

    const anySoloed = soloedVins.size > 0;

    return (
        <div className={tableStyles.container}>
            {/* ── Top bar ── */}
            <div className={tableStyles.topBar}>
                <div style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0, overflow: "hidden", gap: 4, marginLeft: -6 }}>
                    <button
                        ref={chartModeBtnRef}
                        className={s.chartModeTitle}
                        onClick={() => {
                            const rect = chartModeBtnRef.current?.getBoundingClientRect();
                            if (rect) setChartModePos({ top: rect.bottom + 4, left: rect.left });
                            setChartModeOpen((o) => !o);
                        }}
                    >
                        <span className={s.chartModeTitleIcon}>{CHART_MODE_ICONS[chartMode]}</span>
                        {CHART_MODE_LABELS[chartMode]}
                        <BiChevronDown className={s.chartModeTitleChevron} />
                    </button>
                    {entries.length > 0 && !loading && (
                        <span className={s.statsCount}>
                            {sortedVins.length} car{sortedVins.length !== 1 ? "s" : ""}{groupByTimeOn ? ` \u00b7 ${dates.length} ${timeUnit || "period"}${dates.length !== 1 ? "s" : ""}` : ""}
                        </span>
                    )}
                </div>
                <button
                    className={tableStyles.headerMobileBtn}
                    onClick={fetchData}
                    disabled={loading}
                    title="Refresh"
                >
                    <BiRefresh size={17} className={loading ? tableStyles.spinning : ""} />
                </button>
                <button
                    className={`${tableStyles.headerMobileBtn} ${panelOpen ? tableStyles.btnIconActive : ""} ${hasFilters ? tableStyles.btnIconBadge : ""}`}
                    data-count={hasFilters ? activeFilters.length : undefined}
                    onClick={() => setPanelOpen((o) => !o)}
                    title="Options"
                >
                    <BiDockRight />
                </button>
            </div>

            {/* ── Active filter chips ── */}
            {hasFilters && (
                <div className={tableStyles.filterChipsBar}>
                    {activeFilters.map((f) => (
                        <button
                            key={f.id}
                            className={tableStyles.filterChip}
                            onClick={() => { setPanelOpen(true); setPanelTab("filters"); }}
                        >
                            {formatFilterLabel(f)}
                            <span
                                className={tableStyles.filterChipX}
                                onMouseDown={(e) => {
                                    e.stopPropagation();
                                    setActiveFilters((prev) => prev.filter((x) => x.id !== f.id));
                                }}
                            >
                                <BiX size={12} />
                            </span>
                        </button>
                    ))}
                    <button className={tableStyles.filterChipClear} onClick={() => setActiveFilters([])}>
                        Clear filters
                    </button>
                </div>
            )}

            {/* ── Body: chart + filter panel + cars panel ── */}
            <div className={tableStyles.bodyRow}>
                <div ref={chartAreaRef} className={s.chartArea}>
                    {loading ? (
                        <div className={s.loadingState}>
                            <BiRefresh className={tableStyles.spinning} />
                            Loading&hellip;
                        </div>
                    ) : error ? (
                        <div className={s.errorState}>{error}</div>
                    ) : (
                        <div className={s.chartWrapper}>
                            {groupByCarOn && !groupByTimeOn ? (
                                <BarChart carTotals={carTotals} sortedVins={sortedVins} colors={effectiveColorMap} visibleVins={visibleVins} />
                            ) : (
                                <LineChart seriesMap={effectiveSeriesMap} dates={dates} colors={effectiveColorMap} visibleVins={visibleVins} />
                            )}
                        </div>
                    )}
                </div>

                {/* ── Options side panel ── */}
                {panelOpen && (
                    <OptionsSidePanel
                        activeTab={panelTab}
                        onTabChange={setPanelTab}
                        width={panelWidth}
                        onWidthChange={setPanelWidth}
                        onClose={() => setPanelOpen(false)}
                        tabs={[
                            {
                                key: "daterange",
                                label: "Date Range",
                                icon: <BiCalendar />,
                                content: (
                                    <div className={tableStyles.tabPanel}>
                                        <div className={tableStyles.tabField}>
                                            <label className={tableStyles.tabLabel}>Start Date</label>
                                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={tableStyles.fieldInput} />
                                        </div>
                                        <div className={tableStyles.tabField}>
                                            <label className={tableStyles.tabLabel}>End Date</label>
                                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={tableStyles.fieldInput} />
                                        </div>
                                        {groupByTimeOn && (
                                            <div className={tableStyles.tabField}>
                                                <label className={tableStyles.tabLabel}>Time Unit</label>
                                                <select value={timeUnit} onChange={(e) => setTimeUnit(e.target.value as TimeUnit | "")} className={tableStyles.fieldInput}>
                                                    <option value="">Auto</option>
                                                    <option value="day">Day</option>
                                                    <option value="week">Week</option>
                                                    <option value="month">Month</option>
                                                    <option value="year">Year</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                ),
                            },
                            ...(groupByCarOn ? [{
                                key: "cars",
                                label: "Cars",
                                icon: <BiListUl />,
                                dividerBefore: true,
                                badge: (mutedVins.size + soloedVins.size) || undefined,
                                noPadding: true,
                                content: (
                                    <>
                                        {(mutedVins.size > 0 || soloedVins.size > 0 || colorOverrides.size > 0) && (
                                            <div style={{ padding: "10px 12px 0" }}>
                                                <button
                                                    className={tableStyles.colMenuActionBtn}
                                                    onClick={() => { setMutedVins(new Set()); setSoloedVins(new Set()); setColorOverrides(new Map()); }}
                                                >
                                                    Reset
                                                </button>
                                            </div>
                                        )}
                                        {loading || error ? (
                                            <p className={tableStyles.previewPanelEmpty}>{error ?? "Loading…"}</p>
                                        ) : sortedVins.length === 0 ? (
                                            <p className={tableStyles.previewPanelEmpty}>No data.</p>
                                        ) : sortedVins.map((vin) => {
                                            const info = carTotals.get(vin)!;
                                            const color = effectiveColorMap.get(vin) ?? "#888";
                                            const isMuted = mutedVins.has(vin);
                                            const isSoloed = soloedVins.has(vin);
                                            const isVisible = visibleVins.has(vin);
                                            return (
                                                <div key={vin} className={`${s.carRow} ${!isVisible ? s.carRowHidden : ""}`}>
                                                    <button className={s.carDotBtn} title="Change color" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); setColorPickerPos({ top: r.bottom + 4, left: r.left }); setColorPickerVin((prev) => prev === vin ? null : vin); }}>
                                                        <span className={s.carDot} style={{ background: color }} />
                                                    </button>
                                                    <div className={s.carInfo}>
                                                        <p className={s.carName}>{carLabel(info.car)}</p>
                                                        <p className={s.carTotal}>{info.total} total</p>
                                                    </div>
                                                    <button className={`${s.trackBtn} ${isSoloed ? s.soloBtnActive : ""}`} style={!isSoloed && anySoloed ? { color: "var(--color-foreground-light)" } : undefined} onClick={() => toggleSolo(vin)} title="Isolate"><BiCircle /></button>
                                                    <button className={`${s.trackBtn} ${isMuted ? s.muteBtnActive : ""}`} onClick={() => toggleMute(vin)} title="Hide"><FaRegEyeSlash /></button>
                                                </div>
                                            );
                                        })}
                                    </>
                                ),
                            }] : []),
                            {
                                key: "filters",
                                label: "Filters",
                                icon: <BiFilter />,
                                dividerBefore: !groupByCarOn,
                                badge: activeFilters.length || undefined,
                                titleActions: activeFilters.length ? (
                                    <button className={tableStyles.colMenuActionBtn} onClick={() => setActiveFilters([])} style={{ fontSize: "8pt", padding: "2px 8px" }}>
                                        Clear all
                                    </button>
                                ) : undefined,
                                content: (
                                    <BrowseFilterPanel
                                        contentOnly
                                        hideClearAll
                                        filterableColumns={filterableColumns}
                                        activeFilters={activeFilters}
                                        onFiltersChange={setActiveFilters}
                                    />
                                ),
                            },
                            {
                                key: "export",
                                label: "Export",
                                icon: <BiDownload />,
                                dividerBefore: true,
                                content: (
                                    <div className={tableStyles.tabPanel}>
                                        {exportOptions.map((opt) => (
                                            <button key={opt.label} className={tableStyles.panelMenuBtn} onClick={opt.onClick} disabled={opt.disabled || loading || entries.length === 0}>
                                                <span className={tableStyles.panelMenuIcon}>{opt.icon}</span>
                                                <span className={tableStyles.panelMenuText}>
                                                    <span className={tableStyles.panelMenuTitle}>{opt.label}</span>
                                                    {opt.sub && <span className={tableStyles.panelMenuSub}>{opt.sub}</span>}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                ),
                            },
                        ]}
                    />
                )}
            </div>

            {/* ── Chart mode picker ── */}
            {chartModeOpen && typeof document !== "undefined" && createPortal(
                <div
                    data-chartmode-menu="true"
                    className={s.chartModePicker}
                    style={{ top: chartModePos.top, left: chartModePos.left }}
                >
                    {(Object.keys(CHART_MODE_LABELS) as ChartMode[]).map((m) => (
                        <button
                            key={m}
                            className={`${s.chartModePickerOption} ${chartMode === m ? s.chartModePickerOptionActive : ""}`}
                            onClick={() => { setChartMode(m as ChartMode); setChartModeOpen(false); }}
                        >
                            <div className={s.chartModePickerPreview}>
                                {CHART_MODE_PREVIEWS[m as ChartMode]}
                            </div>
                            <span className={s.chartModePickerLabel}>{CHART_MODE_LABELS[m as ChartMode]}</span>
                        </button>
                    ))}
                </div>,
                document.body
            )}

            {colorPickerVin !== null && (
                <CarColorPicker
                    color={effectiveColorMap.get(colorPickerVin) ?? "#888"}
                    defaultColor={colorMap.get(colorPickerVin) ?? "#888"}
                    top={colorPickerPos.top}
                    left={colorPickerPos.left}
                    onChange={(c) => setColorOverrides(prev => { const n = new Map(prev); n.set(colorPickerVin!, c); return n; })}
                    onClose={() => setColorPickerVin(null)}
                />
            )}
        </div>
    );
}
