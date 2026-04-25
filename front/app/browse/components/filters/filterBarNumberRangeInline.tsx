"use client";
import { useState, useRef, useEffect } from "react";
import styles from "./filterBarNumberRangeInline.module.css";

interface FilterBarNumberRangeInlineProps {
    label: string;
    defaultMin?: string;
    defaultMax?: string;
    min?: number;
    max?: number;
    onChange: (min: string, max: string) => void;
}

const FilterBarNumberRangeInline = ({
    label,
    defaultMin,
    defaultMax,
    min: MIN = 0,
    max: MAX = 1000,
    onChange,
}: FilterBarNumberRangeInlineProps) => {
    const [min, setMin] = useState<number>(defaultMin ? parseInt(defaultMin) : MIN);
    const [max, setMax] = useState<number>(defaultMax ? parseInt(defaultMax) : MAX);
    const [minInput, setMinInput] = useState<string>(defaultMin ?? MIN.toString());
    const [maxInput, setMaxInput] = useState<string>(defaultMax ?? MAX.toString());
    const [dragging, setDragging] = useState<"min" | "max" | null>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const minRef = useRef(min);
    const maxRef = useRef(max);

    useEffect(() => { minRef.current = min; }, [min]);
    useEffect(() => { maxRef.current = max; }, [max]);

    const clamp = (val: number) => Math.max(MIN, Math.min(MAX, val));
    const range = MAX - MIN;
    const leftPct = ((clamp(min) - MIN) / range) * 100;
    const rightPct = ((MAX - clamp(max)) / range) * 100;

    const getValueFromX = (clientX: number) => {
        if (!trackRef.current) return null;
        const rect = trackRef.current.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        return Math.round(MIN + pct * range);
    };

    useEffect(() => {
        if (!dragging) return;
        const move = (clientX: number) => {
            const val = getValueFromX(clientX);
            if (val === null) return;
            if (dragging === "min") {
                const clamped = Math.min(val, maxRef.current - 1);
                setMin(clamped);
                setMinInput(clamped.toString());
            } else {
                const clamped = Math.max(val, minRef.current + 1);
                setMax(clamped);
                setMaxInput(clamped.toString());
            }
        };
        const done = () => {
            onChange(minRef.current.toString(), maxRef.current.toString());
            setDragging(null);
        };
        const handleMouseMove = (e: MouseEvent) => move(e.clientX);
        const handleTouchMove = (e: TouchEvent) => { e.preventDefault(); move(e.touches[0].clientX); };
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", done);
        document.addEventListener("touchmove", handleTouchMove, { passive: false });
        document.addEventListener("touchend", done);
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", done);
            document.removeEventListener("touchmove", handleTouchMove);
            document.removeEventListener("touchend", done);
        };
    }, [dragging]);

    const startDrag = (clientX: number) => {
        const val = getValueFromX(clientX);
        if (val === null) return;
        setDragging(Math.abs(val - min) <= Math.abs(val - max) ? "min" : "max");
    };

    const handleTrackMouseDown = (e: React.MouseEvent) => startDrag(e.clientX);
    const handleTrackTouchStart = (e: React.TouchEvent) => startDrag(e.touches[0].clientX);

    const handleMinInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMinInput(e.target.value);
        const val = parseInt(e.target.value);
        if (isNaN(val)) return;
        setMin(val);
        if (val > max) { setMax(val); setMaxInput(val.toString()); }
    };

    const handleMaxInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMaxInput(e.target.value);
        const val = parseInt(e.target.value);
        if (isNaN(val)) return;
        setMax(val);
        if (val < min) { setMin(val); setMinInput(val.toString()); }
    };

    const handleMinBlur = () => {
        const clamped = Math.max(MIN, Math.min(min, max - 1));
        setMin(clamped);
        setMinInput(clamped.toString());
        onChange(clamped.toString(), max.toString());
    };

    const handleMaxBlur = () => {
        const clamped = Math.min(MAX, Math.max(max, min + 1));
        setMax(clamped);
        setMaxInput(clamped.toString());
        onChange(min.toString(), clamped.toString());
    };

    return (
        <div className={styles.root}>
            <div className={styles.header}>
                <p className={styles.headerLabel}>{label}</p>
                <span className={styles.headerRange}>{min} — {max}</span>
            </div>
            <div
                ref={trackRef}
                className={styles.trackWrapper}
                onMouseDown={handleTrackMouseDown}
                onTouchStart={handleTrackTouchStart}
            >
                <div className={styles.trackBg} />
                <div
                    className={styles.trackFill}
                    style={{ left: `${leftPct}%`, right: `${rightPct}%` }}
                />
                <div
                    className={styles.thumb}
                    style={{ left: `${leftPct}%` }}
                />
                <div
                    className={styles.thumb}
                    style={{ left: `${100 - rightPct}%` }}
                />
            </div>
            <div className={styles.inputs}>
                <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Minimum</label>
                    <input
                        type="text"
                        value={minInput}
                        onChange={handleMinInput}
                        onBlur={handleMinBlur}
                        className={styles.input}
                    />
                </div>
                <span className={styles.separator}>—</span>
                <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Maximum</label>
                    <input
                        type="text"
                        value={maxInput}
                        onChange={handleMaxInput}
                        onBlur={handleMaxBlur}
                        className={styles.input}
                    />
                </div>
            </div>
        </div>
    );
};

export default FilterBarNumberRangeInline;
