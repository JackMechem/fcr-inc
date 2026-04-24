"use client";
import { useState, useRef, useEffect } from "react";

interface FilterBarNumberRangeProps {
    label: string;
    paramId: string;
    defaultMin?: string;
    defaultMax?: string;
    min?: number;
    max?: number;
    onApply: (min: string, max: string) => void;
}

const FilterBarNumberRange = ({
    label,
    paramId,
    defaultMin,
    defaultMax,
    min: MIN = 0,
    max: MAX = 1000,
    onApply,
}: FilterBarNumberRangeProps) => {
    const [min, setMin] = useState<number>(defaultMin ? parseInt(defaultMin) : MIN);
    const [max, setMax] = useState<number>(defaultMax ? parseInt(defaultMax) : MAX);
    const [minInput, setMinInput] = useState<string>(defaultMin ?? MIN.toString());
    const [maxInput, setMaxInput] = useState<string>(defaultMax ?? MAX.toString());
    const [open, setOpen] = useState(false);
    const [dragging, setDragging] = useState<"min" | "max" | null>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
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
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                if (open) {
                    onApply(minRef.current.toString(), maxRef.current.toString());
                    setOpen(false);
                }
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

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
        const handleMouseUp = () => setDragging(null);
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

    const handleApply = () => {
        setOpen(false);
        onApply(min.toString(), max.toString());
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
    };

    const handleMaxBlur = () => {
        const clamped = Math.min(MAX, Math.max(max, min + 1));
        setMax(clamped);
        setMaxInput(clamped.toString());
    };

    const displayValue = min === MIN && max === MAX ? "All" : `${min} — ${max}`;

    return (
        <div className="flex flex-col h-full" ref={containerRef}>
            <label className="text-[8pt] font-[500] ml-[2px] text-foreground-light leading-[100%]">
                {label}
            </label>
            <div className="relative h-full">
                <button
                    onClick={() => setOpen((prev) => !prev)}
                    className="bg-primary border h-full border-third rounded-lg px-[10px] py-[5px] w-[140px] text-[11pt] flex items-center gap-[10px] text-nowrap cursor-pointer"
                >
                    {displayValue}
                    <span className="text-foreground-light text-[8pt] ml-auto">▾</span>
                </button>
                {open && (
                    <div className="absolute top-full mt-[4px] left-full -translate-x-1/2 bg-primary border border-third rounded-xl p-[20px] pt-[12px] flex flex-col gap-[12px] z-10 md:w-[400px] w-full">
                        <h1 className="text-foreground-light text-[14pt] font-[400]">{label}</h1>
                        <div
                            ref={trackRef}
                            className="relative h-[20px] flex items-center mt-[16px] cursor-pointer mx-[20px]"
                            onMouseDown={handleTrackMouseDown}
                        >
                            <div className="absolute w-full h-[4px] bg-third rounded-full" />
                            <div
                                className="absolute h-[4px] bg-accent rounded-full"
                                style={{ left: `${leftPct}%`, right: `${rightPct}%` }}
                            />
                            <div
                                className="absolute w-[18px] h-[18px] bg-accent rounded-full -translate-x-1/2 cursor-grab active:cursor-grabbing"
                                style={{ left: `${leftPct}%` }}
                            />
                            <div
                                className="absolute w-[18px] h-[18px] bg-accent rounded-full -translate-x-1/2 cursor-grab active:cursor-grabbing"
                                style={{ left: `${100 - rightPct}%` }}
                            />
                        </div>
                        <div className="flex gap-[5px] items-center justify-between mt-[0px]">
                            <input
                                type="text"
                                value={minInput}
                                onChange={handleMinInput}
                                onBlur={handleMinBlur}
                                className="bg-primary-dark/20 outline-none border border-third rounded-full px-[10px] py-[5px] w-[80px] text-[11pt]"
                            />
                            <input
                                type="text"
                                value={maxInput}
                                onChange={handleMaxInput}
                                onBlur={handleMaxBlur}
                                className="bg-primary-dark/20 outline-none border border-third rounded-full px-[10px] py-[5px] w-[80px] text-[11pt]"
                            />
                        </div>
                        <button
                            onClick={handleApply}
                            className="bg-accent/90 rounded-full px-[10px] py-[5px] mt-[20px] text-primary-dark text-[11pt] font-[500] cursor-pointer w-full"
                        >
                            Apply
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FilterBarNumberRange;
