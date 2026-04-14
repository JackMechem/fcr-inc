"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import bigLogoImageWhite from "../../media/bigLogoWhite.svg";
import smallLogo from "../../media/smallLogo.svg";
import HeaderMenuButton from "../buttons/headerMenuButton";
import DatePicker from "../DatePicker";
import SuggestionsDropdown from "../ui/SuggestionsDropdown";
import { BiSearch } from "react-icons/bi";
import { useFilterParams } from "@/app/hooks/useFilterParams";
import { useScrollCollapse } from "@/app/hooks/useScrollCollapse";
import { useSearchSuggestions } from "@/app/hooks/useSearchSuggestions";
import type { Suggestion } from "@/app/hooks/useSearchSuggestions";
import { saveDates, getStoredDates } from "@/app/lib/browseStorage";
import { useCartStore } from "@/stores/cartStore";
import styles from "./navHeader.module.css";

const COMPACT_SCROLL_THRESHOLD = 100;
const COMPACT_SCROLL_HYSTERESIS = 60;

interface NavHeaderProps {
	white?: boolean;
	filterControls?: React.ReactNode;
	mobileFilterButton?: React.ReactNode;
	activeFilters?: React.ReactNode;
}

const NavHeader = ({
	white = true,
	filterControls,
	mobileFilterButton,
	activeFilters,
}: NavHeaderProps) => {
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
	const searchBarRef = useRef<HTMLDivElement>(null);

	const router = useRouter();
	const pathname = usePathname();
	const { set, params } = useFilterParams();

	const parseDate = (s: string | undefined): Date | undefined => {
		if (!s) return undefined;
		// Parse YYYY-MM-DD as local midnight to avoid UTC off-by-one
		const parts = s.split("-").map(Number);
		if (parts.length !== 3 || parts.some(isNaN)) return undefined;
		const d = new Date(parts[0], parts[1] - 1, parts[2]);
		return isNaN(d.getTime()) ? undefined : d;
	};

	// Use local date parts to avoid UTC timezone off-by-one issues
	const toDateStr = (d: Date | undefined) => {
		if (!d) return undefined;
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, "0");
		const day = String(d.getDate()).padStart(2, "0");
		return `${y}-${m}-${day}`;
	};

	const cartItems = useCartStore((s) => s.carData);
	const cartDateRanges = cartItems
		.filter((c) => c.startDate && c.endDate)
		.map((c) => ({ from: new Date(c.startDate!), to: new Date(c.endDate!) }));

	// Initialize from URL params, falling back to localStorage for cross-page persistence
	const [fromDate, setFromDate] = useState<Date | undefined>(() =>
		parseDate(params.fromDate?.toString()),
	);
	const [untilDate, setUntilDate] = useState<Date | undefined>(() =>
		parseDate(params.untilDate?.toString()),
	);

	// On mount: if URL has no dates, restore from localStorage
	const localStorageInitialized = useRef(false);
	useEffect(() => {
		if (localStorageInitialized.current) return;
		localStorageInitialized.current = true;
		if (!params.fromDate && !params.untilDate) {
			const stored = getStoredDates();
			const storedFrom = stored.get("fromDate");
			const storedUntil = stored.get("untilDate");
			if (storedFrom) setFromDate(parseDate(storedFrom));
			if (storedUntil) setUntilDate(parseDate(storedUntil));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const prevParamFromDate = useRef(params.fromDate?.toString() ?? "");
	const prevParamUntilDate = useRef(params.untilDate?.toString() ?? "");

	const paramFromDate = params.fromDate?.toString() ?? "";
	const paramUntilDate = params.untilDate?.toString() ?? "";

	// Sync from URL changes (e.g. browser back/forward, BrowseParamsSync restoring dates)
	if (paramFromDate !== prevParamFromDate.current) {
		prevParamFromDate.current = paramFromDate;
		if (paramFromDate) {
			setFromDate(parseDate(paramFromDate));
		} else {
			// URL cleared — check localStorage before wiping local state
			const stored = getStoredDates().get("fromDate");
			setFromDate(stored ? parseDate(stored) : undefined);
		}
	}
	if (paramUntilDate !== prevParamUntilDate.current) {
		prevParamUntilDate.current = paramUntilDate;
		if (paramUntilDate) {
			setUntilDate(parseDate(paramUntilDate));
		} else {
			const stored = getStoredDates().get("untilDate");
			setUntilDate(stored ? parseDate(stored) : undefined);
		}
	}

	// True when the selected browse date range overlaps any cart item's rental period
	const hasCartDateConflict =
		!!fromDate &&
		!!untilDate &&
		cartDateRanges.some(
			(r) =>
				fromDate.getTime() < r.to.getTime() &&
				untilDate.getTime() > r.from.getTime(),
		);

	const handleFromDateChange = (d: Date | undefined) => {
		const newUntil = untilDate && d && d > untilDate ? undefined : untilDate;
		setFromDate(d);
		setUntilDate(newUntil);
		set({ fromDate: toDateStr(d), untilDate: toDateStr(newUntil) });
		saveDates(toDateStr(d), toDateStr(newUntil));
	};

	const handleUntilDateChange = (d: Date | undefined) => {
		setUntilDate(d);
		set({ untilDate: toDateStr(d) });
		saveDates(toDateStr(fromDate), toDateStr(d));
	};

	const [searchText, setSearchText] = useState(
		() => params.search?.toString() ?? "",
	);
	const prevParamSearch = useRef(params.search?.toString() ?? "");

	const paramSearch = params.search?.toString() ?? "";
	if (paramSearch !== prevParamSearch.current) {
		prevParamSearch.current = paramSearch;
		setSearchText(paramSearch);
	}

	const isExpanded = useScrollCollapse(
		white,
		COMPACT_SCROLL_THRESHOLD,
		COMPACT_SCROLL_HYSTERESIS,
	);
	const isWhite = white && isExpanded;

	const { suggestions, loadingSuggestions } = useSearchSuggestions(searchText);

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (
				searchBarRef.current &&
				!searchBarRef.current.contains(e.target as Node)
			)
				setShowSuggestions(false);
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	const handleSearch = () => {
		setShowSuggestions(false);
		setHighlightedIndex(-1);
		if (pathname === "/browse") {
			set({ search: searchText || undefined });
		} else {
			const p = new URLSearchParams();
			if (searchText.trim()) p.set("search", searchText);
			router.push(`/browse${p.size ? `?${p}` : ""}`);
		}
	};

	const handleSuggestionClick = (s: Suggestion) => {
		setSearchText(`${s.make} ${s.model}`);
		setShowSuggestions(false);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (!showSuggestions || suggestions.length === 0) {
			if (e.key === "Enter") handleSearch();
			return;
		}
		if (e.key === "Tab") {
			e.preventDefault();
			const next = e.shiftKey
				? highlightedIndex <= 0
					? suggestions.length - 1
					: highlightedIndex - 1
				: highlightedIndex >= suggestions.length - 1
					? 0
					: highlightedIndex + 1;
			setHighlightedIndex(next);
		} else if (e.key === "ArrowDown") {
			e.preventDefault();
			setHighlightedIndex((i) => (i >= suggestions.length - 1 ? 0 : i + 1));
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setHighlightedIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
		} else if (e.key === "Enter") {
			if (highlightedIndex >= 0)
				handleSuggestionClick(suggestions[highlightedIndex]);
			else handleSearch();
		} else if (e.key === "Escape") {
			setShowSuggestions(false);
			setHighlightedIndex(-1);
		}
	};

	const searchButton = (
		<div className={styles.searchBtnContainer}>
			<button onClick={handleSearch} className={styles.searchBtn}>
				<BiSearch />
			</button>
		</div>
	);

	const separator = <div className={styles.separator} />;

	return (
		<div
			className={`${styles.header} ${isWhite ? styles.headerWhite : styles.headerCompact}`}
		>
			{/* ── Main header row ── */}
			<div
				className={`${styles.mainRow} ${isWhite ? styles.mainRowWhite : styles.mainRowCompact}`}
			>
				{/* Logo */}
				<Link href="/" className={styles.logoLink}>
					{isWhite ? (
						<Image
							width={200}
							height={80}
							src={bigLogoImageWhite}
							alt="FCR Logo"
						/>
					) : (
						<Image width={50} height={50} src={smallLogo} alt="FCR Logo" />
					)}
				</Link>

				{/* Desktop search bar + filter (centered) */}
				{!isWhite && (
					<div
						className={`${styles.desktopSearch} ${mobileFilterButton ? styles.desktopSearchHideLg : styles.desktopSearchHideMd}`}
					>
						<div ref={searchBarRef} className={styles.searchBar}>
							<div className={styles.searchField}>
								<p className={styles.searchFieldLabel}>What</p>
								<input
									placeholder="Make & model"
									value={searchText}
									onChange={(e) => {
										setSearchText(e.target.value);
										setShowSuggestions(true);
									}}
									onFocus={() => {
										if (suggestions.length > 0) setShowSuggestions(true);
									}}
									onKeyDown={handleKeyDown}
									className={styles.searchInput}
								/>
							</div>
							{separator}
							<div className={styles.datepickerSlot110}>
								<div className={styles.dateLabelRow}>
									<p className={styles.searchFieldLabel}>From</p>
									{hasCartDateConflict && fromDate && (
										<span className={styles.dateDot} />
									)}
								</div>
								<DatePicker
									label="From"
									showLabel={false}
									selected={fromDate}
									onSelect={handleFromDateChange}
									cartRanges={cartDateRanges}
								/>
							</div>
							{separator}
							<div className={styles.datepickerSlot100}>
								<div className={styles.dateLabelRow}>
									<p className={styles.searchFieldLabel}>Until</p>
									{hasCartDateConflict && untilDate && (
										<span className={styles.dateDot} />
									)}
								</div>
								<DatePicker
									label="Until"
									showLabel={false}
									selected={untilDate}
									onSelect={handleUntilDateChange}
									fromDate={fromDate}
									cartRanges={cartDateRanges}
								/>
							</div>
							{searchButton}
							{showSuggestions &&
								(loadingSuggestions || suggestions.length > 0) && (
									<SuggestionsDropdown
										suggestions={suggestions}
										loading={loadingSuggestions}
										highlightedIndex={highlightedIndex}
										onSelect={handleSuggestionClick}
										onHover={setHighlightedIndex}
									/>
								)}
						</div>
						{filterControls && (
							<div className={styles.filterControlsWrapper}>
								{filterControls}
							</div>
						)}
					</div>
				)}

				{/* Right side: menu button */}
				<div
					className={`${styles.rightSide} ${isWhite ? styles.rightSideWhite : styles.rightSideCompact}`}
				>
					<HeaderMenuButton />
				</div>
			</div>

			{/* ── Mobile search + filter row ── */}
			{!isWhite && mobileFilterButton && (
				<div className={`${styles.mobileRow} ${styles.mobileRowHideDesktop}`}>
					<div ref={searchBarRef} className={styles.mobileSearchBar}>
						<input
							placeholder="Make & model"
							value={searchText}
							onChange={(e) => {
								setSearchText(e.target.value);
								setShowSuggestions(true);
							}}
							onFocus={() => {
								if (suggestions.length > 0) setShowSuggestions(true);
							}}
							onKeyDown={handleKeyDown}
							className={styles.mobileSearchInput}
						/>
						<div className={styles.mobileSeparator} />
						<div className={styles.datepickerSlotDot}>
							<DatePicker
								label="From"
								showLabel={false}
								placeholder="From"
								selected={fromDate}
								onSelect={handleFromDateChange}
								cartRanges={cartDateRanges}
							/>
							{hasCartDateConflict && fromDate && (
								<span className={styles.dateDotAbsolute} />
							)}
						</div>
						<div className={styles.mobileSeparator} />
						<div className={styles.datepickerSlotDot}>
							<DatePicker
								label="Until"
								showLabel={false}
								placeholder="Until"
								selected={untilDate}
								onSelect={handleUntilDateChange}
								fromDate={fromDate}
								cartRanges={cartDateRanges}
							/>
							{hasCartDateConflict && untilDate && (
								<span className={styles.dateDotAbsolute} />
							)}
						</div>
						{searchButton}
						{showSuggestions &&
							(loadingSuggestions || suggestions.length > 0) && (
								<SuggestionsDropdown
									suggestions={suggestions}
									loading={loadingSuggestions}
									highlightedIndex={highlightedIndex}
									onSelect={handleSuggestionClick}
									onHover={setHighlightedIndex}
								/>
							)}
					</div>
					{mobileFilterButton}
				</div>
			)}
		</div>
	);
};

export default NavHeader;
