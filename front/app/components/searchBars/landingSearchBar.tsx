"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { BiSearch } from "react-icons/bi";
import DatePicker from "@/app/components/DatePicker";
import SuggestionsDropdown from "@/app/components/ui/SuggestionsDropdown";
import { useSearchSuggestions } from "@/app/hooks/useSearchSuggestions";
import type { Suggestion } from "@/app/hooks/useSearchSuggestions";

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
							onChange={(e) => {
								setSearchText(e.target.value);
								setShowSuggestions(true);
							}}
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
