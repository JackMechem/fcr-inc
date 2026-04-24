"use client"

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isAfter, isBefore, startOfDay } from "date-fns";
import styles from "./DatePicker.module.css";

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
    cartRanges?: DateRange[];
    allowPast?: boolean;
    autoOpen?: boolean;
    /** Render the popup via a portal so it escapes overflow:hidden containers */
    portal?: boolean;
}

const DatePicker = ({
    label,
    showLabel = true,
    placeholder = "Add date",
    selected,
    onSelect,
    fromDate,
    disabledRanges = [],
    cartRanges = [],
    allowPast = false,
    autoOpen = false,
    portal = false,
}: DatePickerProps) => {
    const [open, setOpen] = useState(autoOpen);
    const [viewMonth, setViewMonth] = useState(selected ?? new Date());
    const [popupPos, setPopupPos] = useState<{ top: number; left: number } | null>(null);
    const [popupAlign, setPopupAlign] = useState<"center" | "left" | "right">("center");
    const [popupAbove, setPopupAbove] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                ref.current && !ref.current.contains(e.target as Node) &&
                !(popupRef.current && popupRef.current.contains(e.target as Node))
            ) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (!open) return;
        if (portal && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setPopupPos({ top: rect.bottom + 4, left: rect.left });
        }
        if (!popupRef.current) return;
        const rect = popupRef.current.getBoundingClientRect();
        setPopupAbove(rect.bottom > window.innerHeight - 8);
        if (rect.right > window.innerWidth - 8) setPopupAlign("right");
        else if (rect.left < 8) setPopupAlign("left");
        else setPopupAlign("center");
    }, [open, portal]);

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

    const isInRange = (day: Date, ranges: DateRange[]) => {
        const d = startOfDay(day);
        return ranges.some(
            ({ from, to }) => !isBefore(d, startOfDay(from)) && !isAfter(d, startOfDay(to))
        );
    };

    const isCartReserved = (day: Date) => isInRange(day, cartRanges);
    const isReserved = (day: Date) => isInRange(day, disabledRanges);

    const isDisabled = (day: Date) => {
        const d = startOfDay(day);
        if (!allowPast && isBefore(d, today)) return true;
        if (fromDate && isBefore(d, startOfDay(fromDate))) return true;
        return isReserved(day) || isCartReserved(day);
    };

    const popupPositionClass = popupAbove ? styles.popupAbove : styles.popupBelow;
    const popupAlignClass = popupAlign === "right" ? styles.popupRight : popupAlign === "left" ? styles.popupLeft : styles.popupCenter;

    const popupEl = open && (
        <div
            ref={popupRef}
            className={`${styles.popup} ${portal ? "" : `${popupPositionClass} ${popupAlignClass}`}`}
            style={portal && popupPos ? { position: "fixed", top: popupPos.top, left: popupPos.left, zIndex: 99999 } : undefined}
        >
            <div className={styles.header}>
                <button
                    type="button"
                    onClick={() => setViewMonth(subMonths(viewMonth, 1))}
                    className={styles.navBtn}
                >
                    ‹
                </button>
                <span className={styles.monthLabel}>
                    {format(viewMonth, "MMMM yyyy")}
                </span>
                <button
                    type="button"
                    onClick={() => setViewMonth(addMonths(viewMonth, 1))}
                    className={styles.navBtn}
                >
                    ›
                </button>
            </div>

            <div className={styles.weekdays}>
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                    <div key={d} className={styles.weekday}>{d}</div>
                ))}
            </div>

            <div className={styles.daysGrid}>
                {days.map((day) => {
                    const disabled = isDisabled(day);
                    const cartDay = isCartReserved(day);
                    const reserved = isReserved(day);
                    const isCurrentMonth = isSameMonth(day, viewMonth);
                    const isSelected = selected && isSameDay(day, selected);
                    const isToday = isSameDay(day, today);

                    let dayClass = styles.day;
                    if (!isCurrentMonth) dayClass += " " + styles.dayOutsideMonth;
                    if (disabled && cartDay) dayClass += " " + styles.dayCartReserved;
                    else if (disabled && reserved) dayClass += " " + styles.dayReserved;
                    else if (disabled) dayClass += " " + styles.dayDisabled;
                    if (isSelected) dayClass += " " + styles.daySelected;
                    else if (isToday && !disabled) dayClass += " " + styles.dayToday;
                    else if (!disabled && isCurrentMonth) dayClass += " " + styles.dayNormal;

                    return (
                        <button
                            key={day.toISOString()}
                            type="button"
                            disabled={disabled}
                            onClick={() => {
                                onSelect(day);
                                setOpen(false);
                            }}
                            className={dayClass}
                        >
                            {format(day, "d")}
                        </button>
                    );
                })}
            </div>

            {selected && (
                <button
                    type="button"
                    onClick={() => {
                        onSelect(undefined);
                        setOpen(false);
                    }}
                    className={styles.clearBtn}
                >
                    Clear
                </button>
            )}
        </div>
    );

    return (
        <div ref={ref} className={styles.wrapper}>
            {showLabel && <p className={styles.label}>{label}</p>}
            <button
                ref={triggerRef}
                type="button"
                onClick={() => {
                    setViewMonth(selected ?? new Date());
                    setPopupAlign("center");
                    setPopupAbove(false);
                    setOpen((prev) => !prev);
                }}
                className={styles.trigger}
            >
                {selected ? format(selected, "MMM d, yyyy") : <span className={styles.placeholder}>{placeholder}</span>}
            </button>

            {portal
                ? (typeof document !== "undefined" && popupEl ? createPortal(popupEl, document.body) : null)
                : popupEl
            }
        </div>
    );
};

export default DatePicker;
