"use client"

import { useState, useRef, useEffect } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isAfter, isBefore, startOfDay } from "date-fns";

interface DateRange {
    from: Date;
    to: Date;
}

interface DatePickerProps {
    label: string;
    showLabel?: boolean;
    placeholder?: string;
    selected?: Date;
    onSelect: (date: Date | undefined) => void;
    fromDate?: Date;
    disabledRanges?: DateRange[];
}

const DatePicker = ({ label, showLabel = true, placeholder = "Add date", selected, onSelect, fromDate, disabledRanges = [] }: DatePickerProps) => {
    const [open, setOpen] = useState(false);
    const [viewMonth, setViewMonth] = useState(selected ?? new Date());
    const [popupAlign, setPopupAlign] = useState<"center" | "left" | "right">("center");
    const [popupAbove, setPopupAbove] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (!open || !popupRef.current) return;
        const rect = popupRef.current.getBoundingClientRect();
        setPopupAbove(rect.bottom > window.innerHeight - 8);
        if (rect.right > window.innerWidth - 8) setPopupAlign("right");
        else if (rect.left < 8) setPopupAlign("left");
        else setPopupAlign("center");
    }, [open]);

    const buildCalendarDays = () => {
        const start = startOfWeek(startOfMonth(viewMonth));
        const end = endOfWeek(endOfMonth(viewMonth));
        const days: Date[] = [];
        let cur = start;
        while (!isAfter(cur, end)) {
            days.push(cur);
            cur = addDays(cur, 1);
        }
        return days;
    };

    const days = buildCalendarDays();
    const today = startOfDay(new Date());

    const isDisabled = (day: Date) => {
        const d = startOfDay(day);
        if (fromDate && isBefore(d, startOfDay(fromDate))) return true;
        return disabledRanges.some(
            ({ from, to }) => !isBefore(d, startOfDay(from)) && !isAfter(d, startOfDay(to))
        );
    };

    return (
        <div ref={ref} className="relative">
            {showLabel && <p className="text-[10pt]">{label}</p>}
            <button
                type="button"
                onClick={() => {
                    setViewMonth(selected ?? new Date());
                    setPopupAlign("center");
                    setPopupAbove(false);
                    setOpen((prev) => !prev);
                }}
                className="outline-none text-foreground w-full text-left text-sm truncate"
            >
                {selected ? format(selected, "MMM d, yyyy") : <span className="text-foreground/50">{placeholder}</span>}
            </button>

            {open && (
                <div
                    ref={popupRef}
                    className={`absolute z-50 bg-primary border border-third rounded-2xl shadow-xl p-4 w-[280px] ${
                        popupAbove ? "bottom-full mb-3" : "top-full mt-3"
                    } ${
                        popupAlign === "right"
                            ? "right-0"
                            : popupAlign === "left"
                            ? "left-0"
                            : "left-1/2 -translate-x-1/2"
                    }`}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                        <button
                            type="button"
                            onClick={() => setViewMonth(subMonths(viewMonth, 1))}
                            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-accent/10 text-foreground transition-colors"
                        >
                            ‹
                        </button>
                        <span className="text-sm font-semibold text-foreground">
                            {format(viewMonth, "MMMM yyyy")}
                        </span>
                        <button
                            type="button"
                            onClick={() => setViewMonth(addMonths(viewMonth, 1))}
                            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-accent/10 text-foreground transition-colors"
                        >
                            ›
                        </button>
                    </div>

                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 mb-1">
                        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                            <div key={d} className="text-center text-[10px] font-medium text-foreground/40 py-1">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Days grid */}
                    <div className="grid grid-cols-7 gap-y-1">
                        {days.map((day) => {
                            const disabled = isDisabled(day);
                            const isCurrentMonth = isSameMonth(day, viewMonth);
                            const isSelected = selected && isSameDay(day, selected);
                            const isToday = isSameDay(day, today);

                            return (
                                <button
                                    key={day.toISOString()}
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => {
                                        onSelect(day);
                                        setOpen(false);
                                    }}
                                    className={[
                                        "w-8 h-8 mx-auto flex items-center justify-center rounded-full text-sm transition-colors",
                                        !isCurrentMonth ? "opacity-25" : "",
                                        disabled ? "cursor-not-allowed opacity-20" : "cursor-pointer",
                                        isSelected
                                            ? "bg-accent text-primary font-semibold"
                                            : isToday && !disabled
                                            ? "border border-accent text-accent font-semibold hover:bg-accent/10"
                                            : !disabled && isCurrentMonth
                                            ? "hover:bg-accent/10 text-foreground"
                                            : "text-foreground",
                                    ].join(" ")}
                                >
                                    {format(day, "d")}
                                </button>
                            );
                        })}
                    </div>

                    {/* Clear button */}
                    {selected && (
                        <button
                            type="button"
                            onClick={() => {
                                onSelect(undefined);
                                setOpen(false);
                            }}
                            className="mt-3 w-full text-center text-xs text-foreground/50 hover:text-accent transition-colors"
                        >
                            Clear
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default DatePicker;
