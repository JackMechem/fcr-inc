"use client";
import { useState, useRef, useEffect } from "react";

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

    const getValueFromEvent = (e: MouseEvent | React.MouseEvent) => {
        if (!trackRef.current) return null;
        const rect = trackRef.current.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        return Math.round(MIN + pct * range);
    };

    useEffect(() => {
        if (!dragging) return;
        const handleMouseMove = (e: MouseEvent) => {
            const val = getValueFromEvent(e);
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
        const handleMouseUp = () => {
            onChange(minRef.current.toString(), maxRef.current.toString());
            setDragging(null);
        };
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [dragging]);

    const handleTrackMouseDown = (e: React.MouseEvent) => {
        const val = getValueFromEvent(e);
        if (val === null) return;
        setDragging(Math.abs(val - min) <= Math.abs(val - max) ? "min" : "max");
    };

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
        <div className="flex flex-col gap-[16px]">
            <div className="flex items-center justify-between">
                <p className="text-foreground text-[13pt] font-[600]">{label}</p>
                <span className="text-foreground-light text-[10pt]">{min} — {max}</span>
            </div>
            <div
                ref={trackRef}
                className="relative h-[20px] flex items-center cursor-pointer mx-[9px]"
                onMouseDown={handleTrackMouseDown}
            >
                <div className="absolute w-full h-[4px] bg-third rounded-full" />
                <div
                    className="absolute h-[4px] bg-accent rounded-full"
                    style={{ left: `${leftPct}%`, right: `${rightPct}%` }}
                />
                <div
                    className="absolute w-[18px] h-[18px] bg-accent rounded-full -translate-x-1/2 cursor-grab active:cursor-grabbing shadow-md"
                    style={{ left: `${leftPct}%` }}
                />
                <div
                    className="absolute w-[18px] h-[18px] bg-accent rounded-full -translate-x-1/2 cursor-grab active:cursor-grabbing shadow-md"
                    style={{ left: `${100 - rightPct}%` }}
                />
            </div>
            <div className="flex items-center justify-between gap-[12px]">
                <div className="flex flex-col gap-[4px] flex-1">
                    <label className="text-foreground-light text-[8pt]">Minimum</label>
                    <input
                        type="text"
                        value={minInput}
                        onChange={handleMinInput}
                        onBlur={handleMinBlur}
                        className="bg-primary-dark/20 outline-none border border-third rounded-xl px-[12px] py-[8px] w-full text-[11pt]"
                    />
                </div>
                <span className="text-foreground-light mt-[16px]">—</span>
                <div className="flex flex-col gap-[4px] flex-1">
                    <label className="text-foreground-light text-[8pt]">Maximum</label>
                    <input
                        type="text"
                        value={maxInput}
                        onChange={handleMaxInput}
                        onBlur={handleMaxBlur}
                        className="bg-primary-dark/20 outline-none border border-third rounded-xl px-[12px] py-[8px] w-full text-[11pt]"
                    />
                </div>
            </div>
        </div>
    );
};

export default FilterBarNumberRangeInline;
