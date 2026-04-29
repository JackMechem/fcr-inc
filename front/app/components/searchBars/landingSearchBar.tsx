"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { BiSearch } from "react-icons/bi";
import DatePicker from "@/app/components/DatePicker";
import SuggestionsDropdown from "@/app/components/ui/SuggestionsDropdown";
import { useSearchSuggestions } from "@/app/hooks/useSearchSuggestions";
import type { Suggestion } from "@/app/hooks/useSearchSuggestions";
import styles from "./landingSearchBar.module.css";

const LandingSearchBar = () => {
	const [searchText, setSearchText] = useState("");
	const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
	const [untilDate, setUntilDate] = useState<Date | undefined>(undefined);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [highlightedIndex, setHighlightedIndex] = useState(-1);
	const containerRef = useRef<HTMLDivElement>(null);
	const router = useRouter();

	const { suggestions, loadingSuggestions } = useSearchSuggestions(searchText);

	const handleSearch = () => {
		setShowSuggestions(false);
		setHighlightedIndex(-1);
		const params = new URLSearchParams();
		if (searchText.trim()) params.set("search", searchText);
		if (fromDate) params.set("fromDate", fromDate.toISOString().split("T")[0]);
		if (untilDate) params.set("untilDate", untilDate.toISOString().split("T")[0]);
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
				? highlightedIndex <= 0 ? suggestions.length - 1 : highlightedIndex - 1
				: highlightedIndex >= suggestions.length - 1 ? 0 : highlightedIndex + 1;
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

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node))
				setShowSuggestions(false);
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	return (
		<div className={styles.outer}>
			<div ref={containerRef} className={styles.relative}>
				<div className={styles.bar}>
					<div>
						<p className={styles.fieldLabel}>What</p>
						<input
							placeholder="Make, model, or year"
							value={searchText}
							onChange={(e) => {
								setSearchText(e.target.value);
								setShowSuggestions(true);
							}}
							onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
							onKeyDown={handleKeyDown}
							className={styles.input}
						/>
					</div>
					<div className={styles.datepickerSlot}>
						<DatePicker
							label="From"
							selected={fromDate}
							onSelect={(date) => {
								setFromDate(date);
								if (untilDate && date && date > untilDate) setUntilDate(undefined);
							}}
						/>
					</div>
					<div className={styles.datepickerSlot}>
						<DatePicker
							label="Until"
							selected={untilDate}
							onSelect={setUntilDate}
							fromDate={fromDate}
						/>
					</div>
					<button onClick={handleSearch} className={styles.searchBtn}>
						<BiSearch />
					</button>
				</div>

				{showSuggestions && (loadingSuggestions || suggestions.length > 0) && (
					<SuggestionsDropdown
						suggestions={suggestions}
						loading={loadingSuggestions}
						highlightedIndex={highlightedIndex}
						onSelect={handleSuggestionClick}
						onHover={setHighlightedIndex}
					/>
				)}
			</div>
		</div>
	);
};

export default LandingSearchBar;
