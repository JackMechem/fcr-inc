"use client"

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { BiSearch } from "react-icons/bi";
import DatePicker from "@/app/components/DatePicker";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const AUTH = "Basic " + btoa("jim:intentionallyInsecurePassword#3");

interface Suggestion { vin: string; make: string; model: string; }

const LandingSearchBar = () => {
    const [searchText, setSearchText] = useState("");
    const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
    const [untilDate, setUntilDate] = useState<Date | undefined>(undefined);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const lastRequestTime = useRef(0);
    const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const router = useRouter();

    const handleSearch = () => {
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        const params = new URLSearchParams();
        if (searchText.trim()) params.set("search", searchText);
        router.push(`/browse${params.size ? `?${params}` : ""}`);
    };

    const handleSuggestionClick = (s: Suggestion) => {
        setSearchText(`${s.make} ${s.model}`);
        setShowSuggestions(false);
        setHighlightedIndex(-1);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showSuggestions || suggestions.length === 0) {
            if (e.key === "Enter") handleSearch();
            return;
        }
        if (e.key === "Tab") {
            e.preventDefault();
            const next = e.shiftKey
                ? (highlightedIndex <= 0 ? suggestions.length - 1 : highlightedIndex - 1)
                : (highlightedIndex >= suggestions.length - 1 ? 0 : highlightedIndex + 1);
            setHighlightedIndex(next);
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightedIndex((i) => (i >= suggestions.length - 1 ? 0 : i + 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightedIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
        } else if (e.key === "Enter") {
            if (highlightedIndex >= 0) handleSuggestionClick(suggestions[highlightedIndex]);
            else handleSearch();
        } else if (e.key === "Escape") {
            setShowSuggestions(false);
            setHighlightedIndex(-1);
        }
    };

    // Debounced fetch with 1 s cooldown
    useEffect(() => {
        if (pendingTimer.current) clearTimeout(pendingTimer.current);
        const doFetch = async () => {
            if (!searchText.trim()) {
                setSuggestions([]);
                setLoadingSuggestions(false);
                return;
            }
            lastRequestTime.current = Date.now();
            setLoadingSuggestions(true);
            try {
                const p = new URLSearchParams({ search: searchText, select: "vin,make,model", pageSize: "6" });
                const res = await fetch(`${API_BASE}/cars?${p}`, { headers: { Authorization: AUTH } });
                if (res.ok) {
                    const data = await res.json();
                    setSuggestions(data.data ?? []);
                    setHighlightedIndex(-1);
                }
            } catch { /* ignore */ }
            setLoadingSuggestions(false);
        };
        const elapsed = !searchText.trim() ? 0 : (Date.now() - lastRequestTime.current >= 1000 ? 0 : 1000 - (Date.now() - lastRequestTime.current));
        pendingTimer.current = setTimeout(doFetch, elapsed);
        return () => { if (pendingTimer.current) clearTimeout(pendingTimer.current); };
    }, [searchText]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node))
                setShowSuggestions(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

	return (
		<div className="w-full flex flex-col md:px-0 px-[20px] items-center">
            <div ref={containerRef} className="relative md:w-auto w-full">
                <div className="flex md:flex-row md:w-auto w-full flex-col gap-[10px] h-auto md:p-[10px] p-[15px] md:pl-[25px] bg-primary md:rounded-full rounded-3xl shadow focus-within:border-accent duration-150">
                    <div>
                        <p className="text-[10pt]">What</p>
                        <input
                            placeholder="Make, model, or year"
                            value={searchText}
                            onChange={(e) => { setSearchText(e.target.value); setShowSuggestions(true); }}
                            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                            onKeyDown={handleKeyDown}
                            className="outline-none text-foreground"
                        />
                    </div>
                    <div className="w-[120px]">
                        <DatePicker
                            label="From"
                            selected={fromDate}
                            onSelect={(date) => {
                                setFromDate(date);
                                if (untilDate && date && date > untilDate) setUntilDate(undefined);
                            }}
                        />
                    </div>
                    <div className="w-[120px]">
                        <DatePicker
                            label="Until"
                            selected={untilDate}
                            onSelect={setUntilDate}
                            fromDate={fromDate}
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        className="cursor-pointer flex justify-center items-center text-center md:h-fill md:py-0 md:mt-0 mt-[10px] py-[10px] px-[10px] text-[18pt] bg-accent text-primary rounded-full"
                    >
                        <BiSearch />
                    </button>
                </div>

                {showSuggestions && (loadingSuggestions || suggestions.length > 0) && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-primary border border-third rounded-2xl shadow-xl overflow-hidden z-50">
                        {loadingSuggestions ? (
                            <div className="flex items-center justify-center py-[14px]">
                                <div className="w-[18px] h-[18px] rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
                            </div>
                        ) : (
                            suggestions.map((s, i) => (
                                <button
                                    key={s.vin}
                                    onMouseDown={(e) => { e.preventDefault(); handleSuggestionClick(s); }}
                                    onMouseEnter={() => setHighlightedIndex(i)}
                                    onMouseLeave={() => setHighlightedIndex(-1)}
                                    className={`w-full text-left px-[16px] py-[10px] text-foreground text-[11pt] flex items-center gap-2 duration-100 cursor-pointer ${
                                        highlightedIndex === i ? "bg-accent/10" : "hover:bg-accent/10"
                                    }`}
                                >
                                    <BiSearch className="text-foreground/40 flex-shrink-0" />
                                    <span>{s.make} {s.model}</span>
                                </button>
                            ))
                        )}
                    </div>
                )}
            </div>
		</div>
	);
};

export default LandingSearchBar;
