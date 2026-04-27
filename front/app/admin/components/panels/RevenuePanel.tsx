"use client";

import { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useUserDashboardStore } from "@/stores/userDashboardStore";
import { BiRefresh, BiLineChart, BiBarChartAlt2, BiX, BiCircle, BiCalendar, BiFilter, BiListUl, BiChevronDown, BiTable, BiCode, BiImage } from "react-icons/bi";
import { FaDollarSign } from "react-icons/fa6";
import { FaRegEyeSlash } from "react-icons/fa6";
import ExportButton from "@/app/admin/components/table/ExportButton";
import CarColorPicker from "./CarColorPicker";
import { downloadData, safeFilename, buildCsv, exportSvg, exportSvgAsPng } from "@/app/admin/components/table/exportUtils";
import { buildQuery } from "@/app/lib/fcr-client/core";
import tableStyles from "@/app/admin/components/table/spreadsheetTable.module.css";
import BrowseFilterPanel from "@/app/admin/components/table/BrowseFilterPanel";
import { type ActiveFilter, type FilterableColumn, formatFilterLabel, filtersToRecord } from "@/app/admin/components/table/FilterPanel";
import { getFilterBarData } from "@/app/browse/actions";
import s from "./PopularityPanel.module.css";

// ── Types ──────────────────────────────────────────────────────────────────────

interface RevenueCar {
    vin: string;
    make: string;
    model: string;
    modelYear?: number;
    [key: string]: unknown;
}

interface RevenueEntry {
    car: RevenueCar;
    timeUnit: number;
    date: string;
    revenue: number;
}

type TimeUnit  = "day" | "week" | "month" | "year";
type ChartMode = "per-car-per-time" | "per-car" | "per-time" | "candlestick";
type CandleUnit = "week" | "month" | "quarter";
type OpenMenu  = "daterange" | null;

const CandlestickIcon = () => (
    <svg viewBox="0 0 14 14" width="1em" height="1em" fill="currentColor" style={{ display: "block" }}>
        <rect x="1.5" y="4" width="3.5" height="5.5" rx="0.5" />
        <line x1="3.25" y1="1.5" x2="3.25" y2="4"    stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="3.25" y1="9.5" x2="3.25" y2="12.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <rect x="9" y="6" width="3.5" height="4" rx="0.5" opacity="0.75" />
        <line x1="10.75" y1="3"  x2="10.75" y2="6"  stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="10.75" y1="10" x2="10.75" y2="12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
);

const CHART_MODE_LABELS: Record<ChartMode, string> = {
    "per-car-per-time": "Revenue per car over time",
    "per-car":          "Revenue per car",
    "per-time":         "Revenue in a time range",
    "candlestick":      "Candlestick chart",
};

const CHART_MODE_ICONS: Record<ChartMode, React.ReactNode> = {
    "per-car-per-time": <BiLineChart />,
    "per-car":          <BiBarChartAlt2 />,
    "per-time":         <BiLineChart />,
    "candlestick":      <CandlestickIcon />,
};

const CHART_MODE_PREVIEWS: Record<ChartMode, React.ReactNode> = {
    "per-car-per-time": (
        <svg viewBox="0 0 120 72" width="120" height="72" style={{ display: "block" }}>
            <defs>
                <linearGradient id="rv-g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e53e3e" stopOpacity="0.18"/><stop offset="100%" stopColor="#e53e3e" stopOpacity="0"/></linearGradient>
            </defs>
            <path d="M6,58 C22,50 34,28 55,18 C74,9 90,32 114,14 L114,64 L6,64 Z" fill="url(#rv-g1)" />
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
                    <linearGradient key={i} id={`rv-b${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={c} stopOpacity="0.9"/>
                        <stop offset="100%" stopColor={c} stopOpacity="0.6"/>
                    </linearGradient>
                ))}
            </defs>
            {[{ x: 8, h: 44, i: 0 },{ x: 28, h: 26, i: 1 },{ x: 48, h: 52, i: 2 },{ x: 68, h: 18, i: 3 },{ x: 88, h: 36, i: 4 }].map(({ x, h, i }) => (
                <rect key={x} x={x} y={64 - h} width={18} height={h} fill={`url(#rv-b${i})`} rx={3} />
            ))}
            <line x1={6} x2={114} y1={64} y2={64} stroke="currentColor" strokeOpacity={0.12} strokeWidth={1} />
        </svg>
    ),
    "per-time": (
        <svg viewBox="0 0 120 72" width="120" height="72" style={{ display: "block" }}>
            <defs>
                <linearGradient id="rv-t1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e53e3e" stopOpacity="0.22"/><stop offset="100%" stopColor="#e53e3e" stopOpacity="0"/></linearGradient>
            </defs>
            <path d="M6,60 C20,52 32,36 50,24 C66,13 82,30 114,16 L114,64 L6,64 Z" fill="url(#rv-t1)" />
            <path d="M6,60 C20,52 32,36 50,24 C66,13 82,30 114,16" fill="none" stroke="#e53e3e" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            <line x1={6} x2={114} y1={64} y2={64} stroke="currentColor" strokeOpacity={0.12} strokeWidth={1} />
        </svg>
    ),
    "candlestick": (() => {
        const candles = [
            { x: 14,  o: 48, c: 28, h: 20, l: 56, bull: true  },
            { x: 34,  o: 28, c: 38, h: 22, l: 44, bull: false },
            { x: 54,  o: 38, c: 18, h: 10, l: 46, bull: true  },
            { x: 74,  o: 18, c: 30, h: 12, l: 36, bull: false },
            { x: 94,  o: 30, c: 14, h: 8,  l: 36, bull: true  },
            { x: 114, o: 14, c: 22, h: 8,  l: 28, bull: false },
        ];
        return (
            <svg viewBox="0 0 120 72" width="120" height="72" style={{ display: "block" }}>
                {candles.map((c) => {
                    const color = c.bull ? "#22c55e" : "#ef4444";
                    return (
                        <g key={c.x}>
                            <line x1={c.x} x2={c.x} y1={c.h} y2={c.l} stroke={color} strokeWidth={1.5} />
                            <rect x={c.x - 5} y={Math.min(c.o, c.c)} width={10} height={Math.max(1, Math.abs(c.o - c.c))} fill={color} fillOpacity={0.85} rx={1} />
                        </g>
                    );
                })}
                <line x1={6} x2={114} y1={64} y2={64} stroke="currentColor" strokeOpacity={0.12} strokeWidth={1} />
            </svg>
        );
    })(),
};

function buildFilterableColumns(makes: string[]): FilterableColumn[] {
    return [
        { field: "search",       label: "Search",         type: "text" },
        { field: "make",         label: "Make",           type: "select", options: makes },
        { field: "pricePerDay",  label: "Price per day",  type: "number", min: 0, max: 2000 },
        { field: "modelYear",    label: "Model year",     type: "number", min: 1900, max: new Date().getFullYear() },
        { field: "bodyType",     label: "Body type",      type: "select", options: ["SEDAN","SUV","TRUCK","CONVERTIBLE","HATCHBACK","FULL_SIZE","COMPACT","WAGON","ELECTRIC","COUPE"] },
        { field: "vehicleClass", label: "Vehicle class",  type: "select", options: ["ECONOMY","LUXURY","PERFORMANCE","OFFROAD","FULL_SIZE","ELECTRIC"] },
        { field: "roofType",     label: "Roof type",      type: "select", options: ["SOFTTOP","HARDTOP","TARGA","SLICKTOP","SUNROOF","PANORAMIC"] },
        { field: "fuel",         label: "Fuel",           type: "select", options: ["GASOLINE","DIESEL","ELECTRIC","HYBRID"] },
        { field: "transmission", label: "Transmission",   type: "select", options: ["AUTOMATIC","MANUAL"] },
        { field: "drivetrain",   label: "Drivetrain",     type: "select", options: ["FWD","RWD","AWD"] },
        { field: "engineLayout", label: "Engine layout",  type: "select", options: ["V","INLINE","FLAT","SINGLE_MOTOR","DUAL_MOTOR"] },
        { field: "horsepower",   label: "Horsepower",     type: "number", min: 0, max: 2000 },
        { field: "torque",       label: "Torque (lb-ft)", type: "number", min: 0, max: 2000 },
        { field: "mpg",          label: "MPG",            type: "number", min: 0, max: 200 },
        { field: "seats",        label: "Seats",          type: "number", min: 1, max: 12 },
        { field: "cylinders",    label: "Cylinders",      type: "number", min: 0, max: 16 },
        { field: "gears",        label: "Gears",          type: "number", min: 1, max: 12 },
    ];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

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

function formatDollar(v: number): string {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${(v / 1_000 % 1 === 0 ? (v / 1_000).toFixed(0) : (v / 1_000).toFixed(1))}k`;
    return `$${v}`;
}

function toISOLocal(date: Date): string { return date.toISOString(); }

function defaultStartDate(): string {
    const d = new Date(); d.setMonth(d.getMonth() - 4); return d.toISOString().slice(0, 10);
}
function defaultEndDate(): string { return new Date().toISOString().slice(0, 10); }

function carLabel(car: RevenueCar | undefined): string {
    if (!car) return "All";
    return `${car.modelYear ? car.modelYear + " " : ""}${car.make} ${car.model}`;
}

function groupByCar(entries: RevenueEntry[]): Map<string, RevenueEntry[]> {
    const map = new Map<string, RevenueEntry[]>();
    for (const entry of entries) {
        const vin = entry.car?.vin ?? "__all__";
        if (!map.has(vin)) map.set(vin, []);
        map.get(vin)!.push(entry);
    }
    for (const [, series] of map) series.sort((a, b) => a.date.localeCompare(b.date));
    return map;
}

function allDates(seriesMap: Map<string, RevenueEntry[]>): string[] {
    const set = new Set<string>();
    for (const [, entries] of seriesMap) for (const e of entries) if (e.date) set.add(e.date);
    return [...set].sort();
}

function getMySQLWeekU(date: Date): number {
    const yearStart = new Date(date.getFullYear(), 0, 1);
    const dayOfYear = Math.round((date.getTime() - yearStart.getTime()) / 86400000);
    return Math.floor((dayOfYear + yearStart.getDay()) / 7);
}
function fmtDay(d: Date): string { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function fmtWeek(d: Date): string { return `${d.getFullYear()}-${String(getMySQLWeekU(d)).padStart(2,"0")}`; }
function fmtMonth(d: Date): string { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; }

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
        const cur = new Date(start); cur.setDate(cur.getDate() - cur.getDay());
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

function computeYTicks(maxVal: number): number[] {
    if (maxVal <= 0) return [0];
    const rawStep = maxVal / 5;
    const mag = Math.pow(10, Math.floor(Math.log10(Math.max(rawStep, 1))));
    const n = rawStep / mag;
    const niceStep = Math.max(1, n <= 1 ? mag : n <= 2 ? mag * 2 : n <= 5 ? mag * 5 : mag * 10);
    const ticks: number[] = [];
    for (let v = 0; v <= maxVal * 1.001 + niceStep; v += niceStep) {
        ticks.push(Math.round(v));
        if (ticks.length >= 7) break;
    }
    return ticks;
}

function catmullRomPath(pts: [number, number][], yFloor: number): string {
    if (pts.length === 0) return "";
    const cy = (y: number) => Math.min(y, yFloor);
    const atFloor = (y: number) => y >= yFloor - 0.5;
    let d = `M ${pts[0][0].toFixed(1)} ${cy(pts[0][1]).toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
        const p1 = pts[i], p2 = pts[i + 1];
        if (atFloor(p1[1]) && atFloor(p2[1])) { d += ` L ${p2[0].toFixed(1)} ${yFloor.toFixed(1)}`; continue; }
        const p0 = pts[Math.max(0, i - 1)], p3 = pts[Math.min(pts.length - 1, i + 2)];
        const cp1x = Math.max(p1[0], Math.min(p2[0], p1[0] + (p2[0] - p0[0]) / 6));
        const cp1y = cy(p1[1] + (p2[1] - p0[1]) / 6);
        const cp2x = Math.max(p1[0], Math.min(p2[0], p2[0] - (p3[0] - p1[0]) / 6));
        const cp2y = cy(p2[1] - (p3[1] - p1[1]) / 6);
        d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)} ${cp2x.toFixed(1)} ${cp2y.toFixed(1)} ${p2[0].toFixed(1)} ${cy(p2[1]).toFixed(1)}`;
    }
    return d;
}

// ── Tooltip ────────────────────────────────────────────────────────────────────

interface TooltipPayloadItem { name: string; value: number; color: string; }

function ChartTooltip({ payload, label, mouseX, mouseY }: { payload: TooltipPayloadItem[]; label: string; mouseX: number; mouseY: number; }) {
    if (!payload.length) return null;
    const sorted = [...payload].sort((a, b) => b.value - a.value);
    const flipX = mouseX > window.innerWidth - 200;
    return (
        <div className={s.tooltip} style={{ position: "fixed", left: flipX ? mouseX - 16 : mouseX + 16, top: mouseY, transform: flipX ? "translate(-100%, -50%)" : "translateY(-50%)", pointerEvents: "none", zIndex: 99999 }}>
            <div className={s.tooltipLabel}>{label}</div>
            {sorted.map((item) => (
                <div key={item.name} className={s.tooltipRow}>
                    <span className={s.tooltipDot} style={{ background: item.color }} />
                    <span className={s.tooltipCar}>{item.name}</span>
                    <span className={s.tooltipPop}>{formatDollar(item.value)}</span>
                </div>
            ))}
        </div>
    );
}

// ── Line Chart ─────────────────────────────────────────────────────────────────

interface LineChartProps {
    seriesMap: Map<string, RevenueEntry[]>;
    dates: string[];
    colors: Map<string, string>;
    visibleVins: Set<string>;
}

const MARGIN = { top: 8, right: 16, bottom: 64, left: 52 };

function LineChart({ seriesMap, dates, colors, visibleVins }: LineChartProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const [size, setSize] = useState({ width: 0, height: 0 });
    const [hoverIdx, setHoverIdx] = useState<number | null>(null);
    const [hoverChartPos, setHoverChartPos] = useState<{ x: number; y: number } | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState({ scaleX: 1, panX: 0, scaleY: 1 });
    const [dragging, setDragging] = useState(false);
    const zoomRef = useRef(zoom);
    const isDragging = useRef(false);
    const dragStartX = useRef(0);
    const dragStartPan = useRef(0);
    const innerWRef = useRef(0);
    const lastMxRef = useRef(0);
    useLayoutEffect(() => { zoomRef.current = zoom; });

    useEffect(() => {
        const el = containerRef.current; if (!el) return;
        const ro = new ResizeObserver(() => setSize({ width: el.clientWidth, height: el.clientHeight }));
        ro.observe(el); setSize({ width: el.clientWidth, height: el.clientHeight });
        return () => ro.disconnect();
    }, []);

    useEffect(() => { setZoom({ scaleX: 1, panX: 0, scaleY: 1 }); }, [dates.join(",")]);

    useEffect(() => {
        const el = containerRef.current; if (!el) return;
        const handler = (e: WheelEvent) => {
            e.preventDefault();
            const factor = e.deltaY < 0 ? 1.2 : 1 / 1.2;
            if (e.shiftKey) {
                const newScaleY = Math.max(0.05, Math.min(20, zoomRef.current.scaleY * factor));
                setZoom(prev => ({ ...prev, scaleY: newScaleY }));
            } else {
                const mx               = lastMxRef.current;
                const iW               = innerWRef.current;
                const { scaleX, panX } = zoomRef.current;
                const newScaleX        = Math.max(1, scaleX * factor);
                const rawPanX          = mx - (mx - panX) * (newScaleX / scaleX);
                setZoom(prev => ({ ...prev, scaleX: newScaleX, panX: Math.min(0, Math.max(iW * (1 - newScaleX), rawPanX)) }));
            }
        };
        el.addEventListener("wheel", handler, { passive: false });
        return () => el.removeEventListener("wheel", handler);
    }, []);

    useEffect(() => {
        const onUp = () => { if (!isDragging.current) return; isDragging.current = false; setDragging(false); };
        window.addEventListener("mouseup", onUp);
        return () => window.removeEventListener("mouseup", onUp);
    }, []);

    const visibleSeries = useMemo(() => [...seriesMap.entries()].filter(([vin]) => visibleVins.has(vin)), [seriesMap, visibleVins]);

    const chartData = useMemo(() => dates.map((date) => {
        const row: Record<string, number> = {};
        for (const [vin, entries] of visibleSeries) {
            const entry = entries.find((e) => e.date === date);
            row[vin] = entry?.revenue ?? 0;
        }
        return row;
    }), [dates, visibleSeries]);

    const { width, height } = size;
    const innerW = Math.max(0, width - MARGIN.left - MARGIN.right);
    const innerH = Math.max(0, height - MARGIN.top - MARGIN.bottom);
    useLayoutEffect(() => { innerWRef.current = innerW; });

    const hasData = dates.length > 0 && visibleSeries.length > 0;
    const allValues = hasData ? [...seriesMap.values()].flatMap(entries => entries.map(e => e.revenue)) : [0];
    const maxVal = Math.max(...allValues, 1);
    const yMaxShown = maxVal / zoom.scaleY;
    const yTicks = computeYTicks(yMaxShown);
    const yMax = yTicks[yTicks.length - 1];

    const xBase = (i: number) => dates.length <= 1 ? innerW / 2 : (i / (dates.length - 1)) * innerW;
    const xScaled = (i: number) => xBase(i) * zoom.scaleX + zoom.panX;
    const yScale = (v: number) => innerH - (v / yMax) * innerH;

    const visibleXIndices = dates.map((_, i) => i).filter(i => { const x = xScaled(i); return x >= -20 && x <= innerW + 20; });

    const handleMouseDown = (e: React.MouseEvent) => { isDragging.current = true; setDragging(true); dragStartX.current = e.clientX; dragStartPan.current = zoomRef.current.panX; setHoverIdx(null); };
    const handleMouseMove = (e: React.MouseEvent<SVGRectElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const mx   = e.clientX - rect.left;
        const my   = e.clientY - rect.top;
        lastMxRef.current = mx;
        if (isDragging.current) {
            const rawPan = dragStartPan.current + e.clientX - dragStartX.current;
            setZoom(prev => ({ ...prev, panX: Math.min(0, Math.max(innerW * (1 - prev.scaleX), rawPan)) }));
        } else {
            setHoverChartPos({ x: mx, y: my });
            const rawIdx = ((mx - zoomRef.current.panX) / (innerW * zoomRef.current.scaleX)) * (dates.length - 1);
            setHoverIdx(Math.max(0, Math.min(dates.length - 1, Math.round(rawIdx))));
            setMousePos({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseLeave = () => { setHoverIdx(null); setHoverChartPos(null); };

    const cursor = dragging ? "grabbing" : zoom.scaleX > 1 ? "grab" : "crosshair";
    const tooltipItems: TooltipPayloadItem[] = hoverIdx !== null && !dragging
        ? visibleSeries.map(([vin, entries]) => ({ name: entries[0]?.car ? carLabel(entries[0].car) : vin, value: chartData[hoverIdx][vin], color: colors.get(vin) ?? "#888" }))
              .filter(item => item.value !== 0)
        : [];

    return (
        <div ref={containerRef} className={s.chartContainer}>
            {!hasData && <div className={s.chartEmpty}>No data to display</div>}
            {hasData && width > 0 && height > 0 && (
                <svg ref={svgRef} width={width} height={height} className={s.chartSvg} style={{ cursor }}>
                    <defs><clipPath id="rv-chart-clip"><rect x={0} y={0} width={innerW} height={innerH} /></clipPath></defs>
                    <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
                        {yTicks.map((v) => (
                            <g key={v}>
                                <line x1={0} x2={innerW} y1={yScale(v)} y2={yScale(v)} stroke="var(--color-third)" strokeDasharray="3,3" strokeWidth={1} />
                                <text x={-6} y={yScale(v)} textAnchor="end" dominantBaseline="middle" fill="var(--color-foreground-light)" fontSize={10}>{formatDollar(v)}</text>
                            </g>
                        ))}
                        {visibleXIndices.map((i) => (
                            <text key={dates[i]} textAnchor="end" transform={`translate(${xScaled(i)},${innerH + 8}) rotate(-45)`} fill="var(--color-foreground-light)" fontSize={10}>{dates[i]}</text>
                        ))}
                        {(zoom.scaleX !== 1 || zoom.scaleY !== 1) && (() => {
                            const badges = [];
                            if (zoom.scaleX !== 1) badges.push(`↔ ${zoom.scaleX.toFixed(1)}×`);
                            if (zoom.scaleY !== 1) badges.push(`↕ ${zoom.scaleY.toFixed(2)}×`);
                            const bw = 64, bh = 17, gap = 4;
                            return <g>{badges.map((b, i) => (<g key={b} transform={`translate(${innerW - badges.length * (bw + gap) + i * (bw + gap)}, 2)`}><rect width={bw} height={bh} rx={4} fill="var(--color-primary)" stroke="var(--color-third)" strokeWidth={1} /><text x={bw/2} y={bh/2+1} textAnchor="middle" dominantBaseline="middle" fill="var(--color-foreground-light)" fontSize={10}>{b}</text></g>))}</g>;
                        })()}
                        <g clipPath="url(#rv-chart-clip)">
                            {visibleSeries.map(([vin]) => {
                                const color = colors.get(vin) ?? "#888";
                                const pts: [number, number][] = chartData.map((d, i) => [xScaled(i), yScale(d[vin])]);
                                return <path key={vin} d={catmullRomPath(pts, innerH)} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />;
                            })}
                            {hoverIdx !== null && !dragging && visibleSeries.map(([vin]) => (
                                <circle key={vin} cx={xScaled(hoverIdx)} cy={yScale(chartData[hoverIdx][vin])} r={4} fill={colors.get(vin) ?? "#888"} stroke="var(--color-primary)" strokeWidth={2} />
                            ))}
                        </g>
                        {hoverChartPos && !dragging && (
                            <>
                                <line x1={hoverChartPos.x} x2={hoverChartPos.x} y1={0} y2={innerH} stroke="var(--color-foreground-light)" strokeWidth={1} strokeDasharray="4,2" opacity={0.5} />
                                <line x1={0} x2={innerW} y1={hoverChartPos.y} y2={hoverChartPos.y} stroke="var(--color-foreground-light)" strokeWidth={1} strokeDasharray="4,2" opacity={0.5} />
                            </>
                        )}
                        <rect x={0} y={0} width={innerW} height={innerH} fill="transparent" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} onDoubleClick={() => setZoom({ scaleX: 1, panX: 0, scaleY: 1 })} />
                    </g>
                </svg>
            )}
            {hoverIdx !== null && !dragging && tooltipItems.length > 0 && typeof document !== "undefined" && createPortal(
                <ChartTooltip payload={tooltipItems} label={dates[hoverIdx]} mouseX={mousePos.x} mouseY={mousePos.y} />, document.body
            )}
        </div>
    );
}

// ── Bar Chart ──────────────────────────────────────────────────────────────────

interface BarChartProps {
    carTotals: Map<string, { car: RevenueCar; total: number }>;
    sortedVins: string[];
    colors: Map<string, string>;
    visibleVins: Set<string>;
}

const BAR_MARGIN = { top: 16, right: 16, bottom: 96, left: 56 };

function BarChart({ carTotals, sortedVins, colors, visibleVins }: BarChartProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ width: 0, height: 0 });
    const [hoverVin, setHoverVin] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const el = containerRef.current; if (!el) return;
        const ro = new ResizeObserver(() => setSize({ width: el.clientWidth, height: el.clientHeight }));
        ro.observe(el); setSize({ width: el.clientWidth, height: el.clientHeight });
        return () => ro.disconnect();
    }, []);

    const visibleVinList = sortedVins.filter((v) => visibleVins.has(v));
    if (visibleVinList.length === 0) return <div className={s.chartEmpty}>No data to display</div>;

    const { width, height } = size;
    const innerW = Math.max(0, width - BAR_MARGIN.left - BAR_MARGIN.right);
    const innerH = Math.max(0, height - BAR_MARGIN.top - BAR_MARGIN.bottom);
    const maxVal = Math.max(...visibleVinList.map((v) => carTotals.get(v)?.total ?? 0), 1);
    const yTicks = computeYTicks(maxVal);
    const yMax = yTicks[yTicks.length - 1];
    const yScale = (v: number) => innerH - (v / yMax) * innerH;
    const gap = Math.max(2, innerW * 0.08 / visibleVinList.length);
    const barW = Math.max(4, (innerW - gap * (visibleVinList.length + 1)) / visibleVinList.length);
    const xPos = (i: number) => gap + i * (barW + gap);

    return (
        <div ref={containerRef} className={s.chartContainer}>
            {width > 0 && height > 0 && (
                <svg width={width} height={height} className={s.chartSvg}>
                    <g transform={`translate(${BAR_MARGIN.left},${BAR_MARGIN.top})`}>
                        {yTicks.map((v) => (
                            <g key={v}>
                                <line x1={0} x2={innerW} y1={yScale(v)} y2={yScale(v)} stroke="var(--color-third)" strokeDasharray="3,3" strokeWidth={1} />
                                <text x={-6} y={yScale(v)} textAnchor="end" dominantBaseline="middle" fill="var(--color-foreground-light)" fontSize={10}>{formatDollar(v)}</text>
                            </g>
                        ))}
                        {visibleVinList.map((vin, i) => {
                            const total = carTotals.get(vin)?.total ?? 0;
                            const color = colors.get(vin) ?? "#888";
                            const x = xPos(i);
                            const barH = Math.max(0, innerH - yScale(total));
                            return (
                                <g key={vin} onMouseEnter={(e) => { setHoverVin(vin); setMousePos({ x: e.clientX, y: e.clientY }); }} onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })} onMouseLeave={() => setHoverVin(null)} style={{ cursor: "default" }}>
                                    <rect x={x} y={yScale(total)} width={barW} height={barH} fill={color} opacity={hoverVin === vin ? 1 : 0.8} rx={2} />
                                    <text transform={`translate(${x + barW / 2},${innerH + 8}) rotate(-45)`} textAnchor="end" fill="var(--color-foreground-light)" fontSize={10}>{carLabel(carTotals.get(vin)!.car)}</text>
                                </g>
                            );
                        })}
                        <line x1={0} x2={innerW} y1={innerH} y2={innerH} stroke="var(--color-third)" strokeWidth={1} />
                    </g>
                </svg>
            )}
            {hoverVin !== null && typeof document !== "undefined" && createPortal(
                <ChartTooltip payload={[{ name: carLabel(carTotals.get(hoverVin)!.car), value: carTotals.get(hoverVin)!.total, color: colors.get(hoverVin) ?? "#888" }]} label="" mouseX={mousePos.x} mouseY={mousePos.y} />, document.body
            )}
        </div>
    );
}

// ── Candlestick ────────────────────────────────────────────────────────────────

interface OHLCCandle {
    period: string;
    open:   number;
    high:   number;
    low:    number;
    close:  number;
    empty?: boolean;
}

function addDaysStr(dateStr: string, days: number): string {
    if (!isFinite(days) || isNaN(days)) return dateStr;
    const d = new Date(dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return dateStr;
    d.setDate(d.getDate() + Math.round(days));
    if (isNaN(d.getTime())) return dateStr;
    return d.toISOString().slice(0, 10);
}

function generateCandlePeriods(startDate: string, endDate: string, unit: CandleUnit): string[] {
    if (!startDate || !endDate) return [];
    const start = new Date(startDate + "T00:00:00");
    const end   = new Date(endDate   + "T23:59:59");
    const out: string[] = [];
    if (unit === "week") {
        const cur = new Date(start);
        cur.setDate(cur.getDate() - cur.getDay()); // align to Sunday
        while (cur <= end) { out.push(fmtWeek(cur)); cur.setDate(cur.getDate() + 7); }
    } else if (unit === "month") {
        const cur = new Date(start.getFullYear(), start.getMonth(), 1);
        const endM = new Date(end.getFullYear(), end.getMonth(), 1);
        while (cur <= endM) {
            out.push(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}`);
            cur.setMonth(cur.getMonth() + 1);
        }
    } else {
        const cur = new Date(start.getFullYear(), Math.floor(start.getMonth() / 3) * 3, 1);
        while (cur <= end) {
            out.push(`${cur.getFullYear()}-Q${Math.floor(cur.getMonth() / 3) + 1}`);
            cur.setMonth(cur.getMonth() + 3);
        }
    }
    return [...new Set(out)];
}

function groupToOHLC(entries: RevenueEntry[], unit: CandleUnit): OHLCCandle[] {
    const getPeriod = (date: string): string => {
        const d = new Date(date + "T00:00:00");
        if (unit === "month") {
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        }
        if (unit === "quarter") {
            return `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`;
        }
        // week
        return fmtWeek(d);
    };

    const groups = new Map<string, RevenueEntry[]>();
    for (const e of entries) {
        const p = getPeriod(e.date);
        if (!groups.has(p)) groups.set(p, []);
        groups.get(p)!.push(e);
    }

    return [...groups.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([period, group]) => {
            const sorted   = [...group].sort((a, b) => a.date.localeCompare(b.date));
            const revenues = sorted.map(e => e.revenue);
            return {
                period,
                open:  revenues[0],
                close: revenues[revenues.length - 1],
                high:  Math.max(...revenues),
                low:   Math.min(...revenues),
            };
        });
}

function CandlestickTooltip({ candle, mouseX, mouseY }: { candle: OHLCCandle; mouseX: number; mouseY: number }) {
    const bullish = candle.close >= candle.open;
    const flipX   = mouseX > window.innerWidth - 210;
    const rows: { label: string; color: string; value: number }[] = [
        { label: "Open",  color: "var(--color-foreground-light)", value: candle.open  },
        { label: "High",  color: "#22c55e",                       value: candle.high  },
        { label: "Low",   color: "#ef4444",                       value: candle.low   },
        { label: "Close", color: bullish ? "#22c55e" : "#ef4444", value: candle.close },
    ];
    return (
        <div className={s.tooltip} style={{
            position: "fixed",
            left: flipX ? mouseX - 16 : mouseX + 16,
            top: mouseY,
            transform: flipX ? "translate(-100%, -50%)" : "translateY(-50%)",
            pointerEvents: "none",
            zIndex: 99999,
        }}>
            <div className={s.tooltipLabel}>{candle.period}</div>
            {rows.map(r => (
                <div key={r.label} className={s.tooltipRow}>
                    <span style={{ fontSize: "8pt", color: r.color, width: 34, flexShrink: 0 }}>{r.label}</span>
                    <span className={s.tooltipPop}>{formatDollar(r.value)}</span>
                </div>
            ))}
        </div>
    );
}

const CSTICK_MARGIN = { top: 8, right: 16, bottom: 32, left: 52 };

function fmtPeriodLabel(period: string, unit: CandleUnit): string {
    const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const nn = period.match(/^(\d{4})-(\d{2})$/);
    if (unit === "week"    && nn) return `W${nn[2]} '${nn[1].slice(2)}`;
    if (unit === "month"   && nn) return `${MONTHS[+nn[2] - 1] ?? "?"} '${nn[1].slice(2)}`;
    const q = period.match(/^(\d{4})-Q(\d)$/);
    if (unit === "quarter" && q)  return `Q${q[2]} '${q[1].slice(2)}`;
    return period;
}

const CANDLE_DAYS: Record<CandleUnit, number> = { week: 7, month: 30, quarter: 91 };

function CandlestickChart({ candles, startDate, endDate, candleUnit, onExpandRange }: {
    candles: OHLCCandle[];
    startDate: string;
    endDate: string;
    candleUnit: CandleUnit;
    onExpandRange: (newStart: string, newEnd: string) => void;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef       = useRef<SVGSVGElement>(null);
    const [size,     setSize]     = useState({ width: 0, height: 0 });
    const [hoverIdx,    setHoverIdx]    = useState<number | null>(null);
    const [mousePos,    setMousePos]    = useState({ x: 0, y: 0 });
    const [chartMouse,  setChartMouse]  = useState<{ x: number; y: number } | null>(null);
    const [zoom,        setZoom]        = useState({ scaleX: 1, panX: 0, scaleY: 1 });
    const [dragging,    setDragging]    = useState(false);

    const zoomRef          = useRef(zoom);
    const isDragging       = useRef(false);
    const dragStartX       = useRef(0);
    const dragStartPan     = useRef(0);
    const innerWRef        = useRef(0);
    const lastMxRef        = useRef(0);
    const expandDebounce   = useRef<ReturnType<typeof setTimeout> | null>(null);
    const startDateRef     = useRef(startDate);
    const endDateRef       = useRef(endDate);
    const candleUnitRef    = useRef(candleUnit);
    const onExpandRangeRef = useRef(onExpandRange);
    const candlesRef       = useRef(candles);
    useLayoutEffect(() => {
        zoomRef.current          = zoom;
        startDateRef.current     = startDate;
        endDateRef.current       = endDate;
        candleUnitRef.current    = candleUnit;
        onExpandRangeRef.current = onExpandRange;
        candlesRef.current       = candles;
    });
    const prevCandlesRef   = useRef<OHLCCandle[]>([]);

    useEffect(() => {
        const el = containerRef.current; if (!el) return;
        const ro = new ResizeObserver(() => setSize({ width: el.clientWidth, height: el.clientHeight }));
        ro.observe(el); setSize({ width: el.clientWidth, height: el.clientHeight });
        return () => ro.disconnect();
    }, []);

    // Preserve view when candles expand — anchor to the last (most recent) candle
    useEffect(() => {
        const old = prevCandlesRef.current;
        prevCandlesRef.current = candles;
        if (old.length === 0) {
            setZoom({ scaleX: 1, panX: 0, scaleY: 1 });
            return;
        }
        if (candles.length === 0 || candles.length === old.length) return;
        // Find where the last old candle landed in the new array
        const lastOldPeriod = old[old.length - 1]?.period;
        const lastNewIdx    = candles.findIndex(c => c.period === lastOldPeriod);
        if (lastNewIdx < 0) return;
        setZoom(prev => {
            const iW       = innerWRef.current;
            const oldSlotW = (iW / Math.max(1, old.length))     * prev.scaleX;
            const newSlotW = (iW / Math.max(1, candles.length)) * prev.scaleX;
            // Screen position of the last old candle before the update
            const lastOldPos = (old.length - 0.5) * oldSlotW + prev.panX;
            // Recompute panX so that same candle stays at the same screen X
            const newPanX    = lastOldPos - (lastNewIdx + 0.5) * newSlotW;
            return { ...prev, panX: newPanX };
        });
    }, [candles]);

    const scheduleExpand = () => {
        if (expandDebounce.current) clearTimeout(expandDebounce.current);
        expandDebounce.current = setTimeout(() => {
            const { scaleX, panX } = zoomRef.current;
            // Never fetch on zoom-out alone — only fetch when panned past the first candle
            if (scaleX <= 1) return;
            const count  = candlesRef.current.length;
            const iW     = innerWRef.current;
            if (iW <= 0 || count <= 0) return;
            const slotW  = (iW / count) * scaleX;
            const days   = CANDLE_DAYS[candleUnitRef.current];
            const extraBefore = panX > slotW ? Math.ceil((panX - slotW) / slotW) : 0;
            if (extraBefore < 1) return;
            const ns    = addDaysStr(startDateRef.current, -Math.ceil(extraBefore) * days);
            const today = new Date().toISOString().slice(0, 10);
            if (ns === startDateRef.current) return;
            onExpandRangeRef.current(ns, today);
        }, 600);
    };

    useEffect(() => {
        const el = containerRef.current; if (!el) return;
        const handler = (e: WheelEvent) => {
            e.preventDefault();
            const factor = e.deltaY < 0 ? 1.2 : 1 / 1.2;
            if (e.shiftKey) {
                const newScaleY = Math.max(0.05, Math.min(20, zoomRef.current.scaleY * factor));
                setZoom(prev => ({ ...prev, scaleY: newScaleY }));
            } else {
                const mx        = lastMxRef.current;
                const iW        = innerWRef.current;
                const { scaleX, panX } = zoomRef.current;
                const newScaleX = Math.max(0.01, scaleX * factor);
                const count     = candlesRef.current.length;
                const slotW     = (iW / Math.max(1, count)) * newScaleX;
                const maxPanX   = iW - count * slotW;
                // When zoomed out (all data fits), lock right-aligned; otherwise clamp right edge
                const rawPanX   = mx - (mx - panX) * (newScaleX / scaleX);
                const newPanX   = newScaleX <= 1 ? maxPanX : Math.min(maxPanX, rawPanX);
                setZoom(prev => ({ ...prev, scaleX: newScaleX, panX: newPanX }));
                scheduleExpand();
            }
        };
        el.addEventListener("wheel", handler, { passive: false });
        return () => { el.removeEventListener("wheel", handler); if (expandDebounce.current) clearTimeout(expandDebounce.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const onUp = () => {
            if (!isDragging.current) return;
            isDragging.current = false;
            setDragging(false);
            scheduleExpand();
        };
        window.addEventListener("mouseup", onUp);
        return () => window.removeEventListener("mouseup", onUp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const { width, height } = size;
    const innerW = Math.max(0, width  - CSTICK_MARGIN.left - CSTICK_MARGIN.right);
    const innerH = Math.max(0, height - CSTICK_MARGIN.top  - CSTICK_MARGIN.bottom);
    useLayoutEffect(() => { innerWRef.current = innerW; });

    const dataCandles = candles.filter(c => !c.empty);
    const hasData     = dataCandles.length > 0;

    const allValues  = hasData ? dataCandles.flatMap(c => [c.high, c.low]) : [0];
    const rawMax     = Math.max(...allValues, 1);
    const yMaxShown  = rawMax / zoom.scaleY;
    const yTicks     = computeYTicks(yMaxShown);
    const yMax       = yTicks[yTicks.length - 1];
    const yScale     = (v: number) => innerH - (v / yMax) * innerH;

    // Scaled slot/candle geometry
    const baseSlotW = innerW / Math.max(1, candles.length);
    const slotW     = baseSlotW * zoom.scaleX;
    const candleW   = Math.max(3, Math.min(24, slotW * 0.6));
    const xCenter   = (i: number) => (i + 0.5) * slotW + zoom.panX;

    const visibleRange = candles.map((_, i) => i).filter(i => {
        const cx = xCenter(i);
        return cx > -slotW && cx < innerW + slotW;
    });

    // Thin out X labels so they don't overlap (~68px each horizontal)
    const labelStep = Math.max(1, Math.ceil(visibleRange.length / Math.max(1, innerW / 68)));

    const cursor = dragging ? "grabbing" : "crosshair";

    const handleMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true; setDragging(true);
        dragStartX.current = e.clientX; dragStartPan.current = zoomRef.current.panX;
        setHoverIdx(null); setChartMouse(null);
    };
    const handleMouseMove = (e: React.MouseEvent<SVGRectElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const mx   = e.clientX - rect.left;
        const my   = e.clientY - rect.top;
        lastMxRef.current = mx;
        if (isDragging.current) {
            const rawPan = dragStartPan.current + e.clientX - dragStartX.current;
            setZoom(prev => {
                const count   = candlesRef.current.length;
                const iW      = innerWRef.current;
                const slotW   = (iW / Math.max(1, count)) * prev.scaleX;
                const maxPanX = iW - count * slotW;
                // When zoomed out, data is right-aligned — no panning
                if (prev.scaleX <= 1) return prev;
                return { ...prev, panX: Math.min(maxPanX, rawPan) };
            });
        } else {
            const i = Math.floor((mx - zoomRef.current.panX) / slotW);
            setHoverIdx(i >= 0 && i < candles.length && !candles[i].empty ? i : null);
            setMousePos({ x: e.clientX, y: e.clientY });
            setChartMouse({ x: mx, y: my });
        }
    };
    const handleMouseLeave = () => {
        if (!isDragging.current) { setHoverIdx(null); setChartMouse(null); }
    };

    // Zoom badges
    const normalEnd    = innerW * (1 - zoom.scaleX);
    const outOfBounds  = zoom.panX > 0 || zoom.panX < normalEnd || zoom.scaleX < 1;
    const badges: string[] = [];
    if (outOfBounds || Math.abs(zoom.scaleX - 1) > 0.02)
        badges.push(outOfBounds ? `↔ fetching…` : `↔ ${zoom.scaleX.toFixed(1)}×`);
    if (zoom.scaleY !== 1) badges.push(`↕ ${zoom.scaleY.toFixed(2)}×`);
    const bw = 64, bh = 17, badgeGap = 4;

    return (
        <div ref={containerRef} className={s.chartContainer}>
            {!hasData && <div className={s.chartEmpty}>No data to display</div>}
            {hasData && width > 0 && height > 0 && (
                <svg ref={svgRef} width={width} height={height} className={s.chartSvg} style={{ cursor }}>
                    <defs>
                        <clipPath id="rv-cs-clip"><rect x={0} y={0} width={innerW} height={innerH} /></clipPath>
                    </defs>
                    <g transform={`translate(${CSTICK_MARGIN.left},${CSTICK_MARGIN.top})`}>
                        {/* Y grid + labels */}
                        {yTicks.map(v => (
                            <g key={v}>
                                <line x1={0} x2={innerW} y1={yScale(v)} y2={yScale(v)} stroke="var(--color-third)" strokeDasharray="3,3" strokeWidth={1} />
                                <text x={-6} y={yScale(v)} textAnchor="end" dominantBaseline="middle" fill="var(--color-foreground-light)" fontSize={10}>{formatDollar(v)}</text>
                            </g>
                        ))}
                        {/* X labels — visible range, thinned so they don't overlap */}
                        {visibleRange.filter((_, nth) => nth % labelStep === 0).map(i => (
                            <text key={candles[i].period}
                                x={xCenter(i)} y={innerH + 18}
                                textAnchor="middle" fill="var(--color-foreground-light)" fontSize={10}
                                opacity={candles[i].empty ? 0.3 : 1}>
                                {fmtPeriodLabel(candles[i].period, candleUnit)}
                            </text>
                        ))}
                        {/* Zoom badges */}
                        {badges.length > 0 && (
                            <g>
                                {badges.map((b, bi) => (
                                    <g key={b} transform={`translate(${innerW - badges.length * (bw + badgeGap) + bi * (bw + badgeGap)}, 2)`}>
                                        <rect width={bw} height={bh} rx={4} fill="var(--color-primary)" stroke="var(--color-third)" strokeWidth={1} />
                                        <text x={bw / 2} y={bh / 2 + 1} textAnchor="middle" dominantBaseline="middle" fill="var(--color-foreground-light)" fontSize={10}>{b}</text>
                                    </g>
                                ))}
                            </g>
                        )}
                        {/* Candles (clipped) */}
                        <g clipPath="url(#rv-cs-clip)">
                            {visibleRange.map(i => {
                                const c = candles[i];
                                if (c.empty) return null;
                                const bullish = c.close >= c.open;
                                const color   = bullish ? "#22c55e" : "#ef4444";
                                const cx      = xCenter(i);
                                const bodyTop = yScale(Math.max(c.open, c.close));
                                const bodyBot = yScale(Math.min(c.open, c.close));
                                const bodyH   = Math.max(1, bodyBot - bodyTop);
                                return (
                                    <g key={c.period} opacity={hoverIdx === i ? 1 : 0.82}>
                                        <line x1={cx} x2={cx} y1={yScale(c.high)} y2={yScale(c.low)}
                                            stroke={color} strokeWidth={Math.max(1, candleW * 0.12)} />
                                        <rect x={cx - candleW / 2} y={bodyTop} width={candleW} height={bodyH}
                                            fill={color} fillOpacity={bullish ? 0.85 : 0.75}
                                            stroke={color} strokeWidth={1} rx={1} />
                                    </g>
                                );
                            })}
                        </g>
                        {/* Crosshair */}
                        {chartMouse && !dragging && (() => {
                            const cx  = chartMouse.x;
                            const cy  = Math.max(0, Math.min(innerH, chartMouse.y));
                            const val = Math.max(0, yMax * (1 - cy / innerH));
                            const lw  = CSTICK_MARGIN.left - 4;
                            return (
                                <>
                                    <line x1={cx} x2={cx} y1={0} y2={innerH}
                                        stroke="var(--color-foreground-light)" strokeWidth={1} strokeDasharray="4,2" opacity={0.45} />
                                    <line x1={0} x2={innerW} y1={cy} y2={cy}
                                        stroke="var(--color-foreground-light)" strokeWidth={1} strokeDasharray="4,2" opacity={0.45} />
                                    <g transform={`translate(${-CSTICK_MARGIN.left}, ${cy})`}>
                                        <rect x={1} y={-9} width={lw} height={18} rx={3}
                                            fill="var(--color-primary)" stroke="var(--color-third)" strokeWidth={1} />
                                        <text x={lw / 2 + 1} y={1} textAnchor="middle" dominantBaseline="middle"
                                            fill="var(--color-foreground)" fontSize={9}>{formatDollar(val)}</text>
                                    </g>
                                </>
                            );
                        })()}
                        {/* Capture rect */}
                        <rect x={0} y={0} width={innerW} height={innerH} fill="transparent"
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                            onDoubleClick={() => setZoom({ scaleX: 1, panX: 0, scaleY: 1 })}
                        />
                    </g>
                </svg>
            )}
            {hoverIdx !== null && !dragging && typeof document !== "undefined" && createPortal(
                <CandlestickTooltip candle={candles[hoverIdx]} mouseX={mousePos.x} mouseY={mousePos.y} />,
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

export default function RevenuePanel() {
    const { sessionToken } = useUserDashboardStore();

    const [startDate, setStartDate] = useState(defaultStartDate);
    const [endDate, setEndDate] = useState(defaultEndDate);
    const [timeUnit, setTimeUnit] = useState<TimeUnit | "">("");
    const [chartMode,   setChartMode]   = useState<ChartMode>("per-car-per-time");
    const [candleUnit,  setCandleUnit]  = useState<CandleUnit>("month");
    const groupByCarOn  = chartMode !== "per-time" && chartMode !== "candlestick";
    const groupByTimeOn = chartMode !== "per-car";
    const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
    const [filterPanelOpen, setFilterPanelOpen] = useState(false);
    const [filterPanelWidth, setFilterPanelWidth] = useState(280);

    const [makes, setMakes] = useState<string[]>([]);
    useEffect(() => { getFilterBarData().then(({ makes }) => setMakes(makes as string[])); }, []);
    const filterableColumns = useMemo(() => buildFilterableColumns(makes), [makes]);

    const [entries, setEntries] = useState<RevenueEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mutedVins, setMutedVins] = useState<Set<string>>(new Set());
    const [soloedVins, setSoloedVins] = useState<Set<string>>(new Set());
    const [colorOverrides, setColorOverrides] = useState<Map<string, string>>(new Map());
    const [colorPickerVin, setColorPickerVin] = useState<string | null>(null);
    const [colorPickerPos, setColorPickerPos] = useState({ top: 0, left: 0 });
    const [sidePanelOpen, setSidePanelOpen] = useState(true);
    const [panelWidth, setPanelWidth] = useState(280);
    const chartAreaRef = useRef<HTMLDivElement>(null);
    const dragStartX = useRef<number | null>(null);
    const dragStartW = useRef<number>(280);

    const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
    const [menuPos, setMenuPos] = useState<{ top: number; right: number }>({ top: 48, right: 8 });
    const dateRangeBtnRef = useRef<HTMLButtonElement>(null);
    const [chartModeOpen, setChartModeOpen] = useState(false);
    const [chartModePos, setChartModePos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
    const chartModeBtnRef = useRef<HTMLButtonElement>(null);

    const toggleMenu = (menu: OpenMenu, btnRef: React.RefObject<HTMLButtonElement | null>) => {
        if (openMenu === menu) { setOpenMenu(null); return; }
        setMenuPos(getMenuPos(btnRef.current));
        setOpenMenu(menu);
    };

    useEffect(() => {
        if (!openMenu) return;
        const handler = (e: MouseEvent) => {
            const inside = (document.querySelector("[data-revenue-menu]") as HTMLElement | null)?.contains(e.target as Node);
            if (!inside && !dateRangeBtnRef.current?.contains(e.target as Node)) setOpenMenu(null);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [openMenu]);

    useEffect(() => {
        if (!chartModeOpen) return;
        const handler = (e: MouseEvent) => {
            const inside = (document.querySelector("[data-chartmode-revenue-menu]") as HTMLElement | null)?.contains(e.target as Node);
            if (!inside && !chartModeBtnRef.current?.contains(e.target as Node)) setChartModeOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [chartModeOpen]);

    const fetchData = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const params: Record<string, string> = {
                groupByCar: groupByCarOn ? "true" : "false",
                groupByTime: groupByTimeOn ? "true" : "false",
                select: "vin,make,model,modelYear",
            };
            if (startDate) params.startDate = toISOLocal(new Date(startDate + "T00:00:00"));
            if (endDate) params.endDate = toISOLocal(new Date(endDate + "T23:59:59"));
            // Candlestick always fetches daily data; client-side groups into candles
            if (chartMode === "candlestick") params.timeUnit = "day";
            else if (timeUnit) params.timeUnit = timeUnit;
            const filterParams = filtersToRecord(activeFilters);
            for (const [k, v] of Object.entries(filterParams)) {
                if (v !== undefined) params[k] = String(v);
            }
            const qs = buildQuery(params);
            const res = await fetch(`/api/stats/revenue?${qs}`, {
                headers: sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {},
                cache: "no-store",
            });
            if (!res.ok) throw new Error(`Request failed (${res.status})`);
            const data: RevenueEntry[] = await res.json();
            setEntries(Array.isArray(data) ? data : []);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load data");
            setEntries([]);
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate, timeUnit, chartMode, activeFilters, sessionToken]);

    useEffect(() => { if (chartMode === "per-car" || chartMode === "candlestick") setTimeUnit(""); }, [chartMode]);
    useEffect(() => { fetchData(); }, [fetchData]);

    const seriesMap = groupByCar(entries);

    const effectiveSeriesMap: Map<string, RevenueEntry[]> = useMemo(() => {
        if (groupByCarOn) return seriesMap;
        const byDate = new Map<string, number>();
        for (const [, series] of seriesMap) for (const e of series) byDate.set(e.date, (byDate.get(e.date) ?? 0) + e.revenue);
        const agg: RevenueEntry[] = [...byDate.entries()]
            .map(([date, revenue]) => ({ car: { vin: "__all__", make: "All", model: "Cars" }, timeUnit: 0, date, revenue }))
            .sort((a, b) => a.date.localeCompare(b.date));
        return new Map([["__all__", agg]]);
    }, [seriesMap, groupByCarOn]);

    const ohlcCandles = useMemo(() => {
        if (chartMode !== "candlestick") return [];
        const rawCandles = groupToOHLC(effectiveSeriesMap.get("__all__") ?? [], candleUnit);
        const ohlcMap    = new Map(rawCandles.map(c => [c.period, c]));
        const allPeriods = generateCandlePeriods(startDate, endDate, candleUnit);
        if (allPeriods.length === 0) return rawCandles;
        return allPeriods.map(p => ohlcMap.get(p) ?? { period: p, open: 0, high: 0, low: 0, close: 0, empty: true as const });
    }, [chartMode, effectiveSeriesMap, candleUnit, startDate, endDate]);

    const apiDates = allDates(effectiveSeriesMap);
    const fmt = detectFormat(apiDates, timeUnit);
    const rangeDates = startDate && endDate ? generateDateRange(startDate, endDate, fmt) : apiDates;
    const dates = [...new Set([...rangeDates, ...apiDates])].sort();

    const carTotals = new Map<string, { car: RevenueCar; total: number }>();
    for (const [vin, series] of effectiveSeriesMap) {
        carTotals.set(vin, { car: series[0].car, total: series.reduce((sum, e) => sum + e.revenue, 0) });
    }
    const sortedVins = [...carTotals.keys()].sort((a, b) => (carTotals.get(b)?.total ?? 0) - (carTotals.get(a)?.total ?? 0));
    const colorMap = new Map<string, string>(sortedVins.map((vin, i) => [vin, chartColor(i)]));
    const effectiveColorMap = new Map(colorMap);
    for (const [vin, color] of colorOverrides) {
        if (effectiveColorMap.has(vin)) effectiveColorMap.set(vin, color);
    }

    useEffect(() => { setMutedVins(new Set()); setSoloedVins(new Set()); setColorOverrides(new Map()); }, [entries]); // eslint-disable-line react-hooks/exhaustive-deps

    const visibleVins: Set<string> = soloedVins.size > 0 ? soloedVins : new Set(sortedVins.filter((v) => !mutedVins.has(v)));
    const toggleMute = (vin: string) => { setMutedVins((p) => { const n = new Set(p); n.has(vin) ? n.delete(vin) : n.add(vin); return n; }); setSoloedVins((p) => { const n = new Set(p); n.delete(vin); return n; }); };
    const toggleSolo = (vin: string) => { setSoloedVins((p) => { const n = new Set(p); n.has(vin) ? n.delete(vin) : n.add(vin); return n; }); setMutedVins((p) => { const n = new Set(p); n.delete(vin); return n; }); };

    const hasFilters = activeFilters.length > 0;

    const panelFilename = (ext: string) => safeFilename("revenue", ext);

    const exportOptions = [
        {
            label: "PNG",
            icon: <BiImage />,
            onClick: async () => {
                const svgEl = chartAreaRef.current?.querySelector<SVGSVGElement>("svg");
                if (svgEl) await exportSvgAsPng(svgEl, panelFilename("png"));
            },
            disabled: loading || entries.length === 0,
        },
        {
            label: "SVG",
            icon: <BiImage />,
            onClick: () => {
                const svgEl = chartAreaRef.current?.querySelector<SVGSVGElement>("svg");
                if (svgEl) exportSvg(svgEl, panelFilename("svg"));
            },
            disabled: loading || entries.length === 0,
        },
        {
            label: "CSV",
            icon: <BiTable />,
            onClick: () => {
                const headers = groupByCarOn
                    ? ["Car", "VIN", "Date", "Revenue"]
                    : ["Date", "Revenue"];
                const rows = entries.map(e => groupByCarOn
                    ? [carLabel(e.car), e.car?.vin ?? "", e.date, e.revenue]
                    : [e.date, e.revenue]
                );
                downloadData(buildCsv(headers, rows), "text/csv;charset=utf-8;", panelFilename("csv"));
            },
            disabled: entries.length === 0,
            divider: true,
        },
        {
            label: "JSON",
            icon: <BiCode />,
            onClick: () => downloadData(JSON.stringify(entries, null, 2), "application/json", panelFilename("json")),
            disabled: entries.length === 0,
        },
    ];

    const anySoloed = soloedVins.size > 0;

    const totalRevenue = [...carTotals.values()].reduce((sum, { total }) => sum + total, 0);

    return (
        <div className={tableStyles.container}>
            <div className={tableStyles.topBar}>
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
                        {chartMode === "candlestick"
                            ? `${ohlcCandles.length} candle${ohlcCandles.length !== 1 ? "s" : ""} · ${formatDollar(totalRevenue)} total`
                            : <>
                                {groupByCarOn && `${sortedVins.length} car${sortedVins.length !== 1 ? "s" : ""}`}
                                {groupByCarOn && groupByTimeOn && " · "}
                                {groupByTimeOn && `${dates.length} ${timeUnit || "period"}${dates.length !== 1 ? "s" : ""}`}
                                {" · "}{formatDollar(totalRevenue)} total
                              </>
                        }
                    </span>
                )}
                {chartMode === "candlestick" && (
                    <div className={s.candleUnitBtns}>
                        {(["week", "month", "quarter"] as CandleUnit[]).map(u => (
                            <button key={u}
                                className={`${s.candleUnitBtn} ${candleUnit === u ? s.candleUnitBtnActive : ""}`}
                                onClick={() => setCandleUnit(u)}
                            >{u === "week" ? "W" : u === "month" ? "M" : "Q"}</button>
                        ))}
                    </div>
                )}
                <div className={s.spacer} />
                <div className={tableStyles.headerBtns}>
                    <button ref={dateRangeBtnRef} className={`${tableStyles.btnIcon} ${openMenu === "daterange" ? tableStyles.btnIconActive : ""}`} onClick={() => toggleMenu("daterange", dateRangeBtnRef)} title="Date range & time unit"><BiCalendar /></button>
                    <button className={`${tableStyles.btnIcon} ${filterPanelOpen ? tableStyles.btnIconActive : ""} ${hasFilters ? tableStyles.btnIconBadge : ""}`} onClick={() => { setFilterPanelOpen((o) => { if (!o) setSidePanelOpen(false); return !o; }); }} title="Filters"><BiFilter /></button>
                    {groupByCarOn && (
                        <button className={`${tableStyles.btnIcon} ${sidePanelOpen ? tableStyles.btnIconActive : ""}`} onClick={() => { setSidePanelOpen((o) => { if (!o) setFilterPanelOpen(false); return !o; }); }} title={sidePanelOpen ? "Hide cars panel" : "Show cars panel"}><BiListUl /></button>
                    )}
                    <div className={tableStyles.topDivider} />
                    <ExportButton options={exportOptions} disabled={loading || entries.length === 0} btnClassName={tableStyles.btnIcon} />
                    <button className={tableStyles.btnIcon} onClick={fetchData} disabled={loading} title="Refresh"><BiRefresh className={loading ? tableStyles.spinning : ""} /></button>
                </div>
            </div>

            {hasFilters && (
                <div className={tableStyles.filterChipsBar}>
                    {activeFilters.map((f) => (
                        <button key={f.id} className={tableStyles.filterChip} onClick={() => { setFilterPanelOpen(true); setSidePanelOpen(false); }}>
                            {formatFilterLabel(f)}
                            <span className={tableStyles.filterChipX} onMouseDown={(e) => { e.stopPropagation(); setActiveFilters((prev) => prev.filter((x) => x.id !== f.id)); }}><BiX size={12} /></span>
                        </button>
                    ))}
                    <button className={tableStyles.filterChipClear} onClick={() => setActiveFilters([])}>Clear filters</button>
                </div>
            )}

            <div className={tableStyles.bodyRow}>
                <div ref={chartAreaRef} className={s.chartArea}>
                    {loading && entries.length === 0 ? (
                        <div className={s.loadingState}><BiRefresh className={tableStyles.spinning} />Loading&hellip;</div>
                    ) : error ? (
                        <div className={s.errorState}>{error}</div>
                    ) : (
                        <div className={s.chartWrapper}>
                            {chartMode === "candlestick" ? (
                                <CandlestickChart
                                    candles={ohlcCandles}
                                    startDate={startDate}
                                    endDate={endDate}
                                    candleUnit={candleUnit}
                                    onExpandRange={(ns, ne) => {
                                        const today = new Date().toISOString().slice(0, 10);
                                        setStartDate(ns);
                                        setEndDate(ne > today ? today : ne);
                                    }}
                                />
                            ) : groupByCarOn && !groupByTimeOn ? (
                                <BarChart carTotals={carTotals} sortedVins={sortedVins} colors={effectiveColorMap} visibleVins={visibleVins} />
                            ) : (
                                <LineChart seriesMap={effectiveSeriesMap} dates={dates} colors={effectiveColorMap} visibleVins={visibleVins} />
                            )}
                        </div>
                    )}
                </div>

                {filterPanelOpen && (
                    <BrowseFilterPanel filterableColumns={filterableColumns} activeFilters={activeFilters} onFiltersChange={setActiveFilters} width={filterPanelWidth} onWidthChange={setFilterPanelWidth} onClose={() => setFilterPanelOpen(false)} />
                )}

                {groupByCarOn && sidePanelOpen && !loading && !error && (
                    <div className={tableStyles.panelResizeHandle} onMouseDown={(e) => {
                        e.preventDefault(); dragStartX.current = e.clientX; dragStartW.current = panelWidth;
                        const onMove = (ev: MouseEvent) => { if (dragStartX.current === null) return; setPanelWidth(Math.max(200, Math.min(600, dragStartW.current + dragStartX.current - ev.clientX))); };
                        const onUp = () => { dragStartX.current = null; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
                        window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
                    }} />
                )}

                {groupByCarOn && sidePanelOpen && !loading && !error && sortedVins.length > 0 && (
                    <div className={tableStyles.previewPanel} style={{ width: panelWidth }}>
                        <div className={tableStyles.previewPanelHeader}>
                            <span className={tableStyles.previewPanelTitle}>Cars</span>
                            {(mutedVins.size > 0 || soloedVins.size > 0 || colorOverrides.size > 0) && (
                                <button
                                    className={s.panelResetBtn}
                                    onClick={() => { setMutedVins(new Set()); setSoloedVins(new Set()); setColorOverrides(new Map()); }}
                                >Reset</button>
                            )}
                            <div style={{ flex: 1 }} />
                            <button className={tableStyles.btnIcon} onClick={() => setSidePanelOpen(false)} title="Close"><BiX /></button>
                        </div>
                        <div className={tableStyles.previewPanelBody} style={{ padding: 0 }}>
                            {sortedVins.length === 0 ? (
                                <p className={tableStyles.previewPanelEmpty}>No data.</p>
                            ) : sortedVins.map((vin) => {
                                const info = carTotals.get(vin)!;
                                const color = effectiveColorMap.get(vin) ?? "#888";
                                const isMuted = mutedVins.has(vin);
                                const isSoloed = soloedVins.has(vin);
                                return (
                                    <div key={vin} className={`${s.carRow} ${!visibleVins.has(vin) ? s.carRowHidden : ""}`}>
                                        <button
                                            className={s.carDotBtn}
                                            title="Change color"
                                            onClick={(e) => {
                                                const r = e.currentTarget.getBoundingClientRect();
                                                setColorPickerPos({ top: r.bottom + 4, left: r.left });
                                                setColorPickerVin((prev) => prev === vin ? null : vin);
                                            }}
                                        >
                                            <span className={s.carDot} style={{ background: color }} />
                                        </button>
                                        <div className={s.carInfo}>
                                            <p className={s.carName}>{carLabel(info.car)}</p>
                                            <p className={s.carTotal}>{formatDollar(info.total)}</p>
                                        </div>
                                        <button className={`${s.trackBtn} ${isSoloed ? s.soloBtnActive : ""}`} style={!isSoloed && anySoloed ? { color: "var(--color-foreground-light)" } : undefined} onClick={() => toggleSolo(vin)} title="Isolate"><BiCircle /></button>
                                        <button className={`${s.trackBtn} ${isMuted ? s.muteBtnActive : ""}`} onClick={() => toggleMute(vin)} title="Hide"><FaRegEyeSlash /></button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {chartModeOpen && typeof document !== "undefined" && createPortal(
                <div data-chartmode-revenue-menu="true" className={s.chartModePicker} style={{ top: chartModePos.top, left: chartModePos.left }}>
                    {(Object.keys(CHART_MODE_LABELS) as ChartMode[]).map((m) => (
                        <button key={m} className={`${s.chartModePickerOption} ${chartMode === m ? s.chartModePickerOptionActive : ""}`} onClick={() => { setChartMode(m); setChartModeOpen(false); }}>
                            <div className={s.chartModePickerPreview}>{CHART_MODE_PREVIEWS[m]}</div>
                            <span className={s.chartModePickerLabel}>{CHART_MODE_LABELS[m]}</span>
                        </button>
                    ))}
                </div>,
                document.body
            )}

            {typeof document !== "undefined" && openMenu === "daterange" && createPortal(
                <div data-revenue-menu="true" className={`${tableStyles.contextMenu} ${s.menuContent}`} style={{ top: menuPos.top, right: menuPos.right, minWidth: 240 }}>
                    <p className={tableStyles.ctxSection} style={{ padding: "0 0 8px" }}>Date Range</p>
                    <div className={s.menuFields}>
                        <div className={s.menuField}><label className={s.menuLabel}>Start Date</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={s.menuInput} /></div>
                        <div className={s.menuField}><label className={s.menuLabel}>End Date</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={s.menuInput} /></div>
                        {chartMode !== "candlestick" && <>
                            <div className={tableStyles.ctxDivider} />
                            <div className={s.menuField}>
                                <label className={s.menuLabel} style={!groupByTimeOn ? { opacity: 0.4 } : undefined}>Time Unit</label>
                                <select value={timeUnit} onChange={(e) => setTimeUnit(e.target.value as TimeUnit | "")} className={s.menuInput} disabled={!groupByTimeOn}>
                                    <option value="">Auto</option>
                                    <option value="day">Day</option>
                                    <option value="week">Week</option>
                                    <option value="month">Month</option>
                                    <option value="year">Year</option>
                                </select>
                            </div>
                        </>}
                    </div>
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
