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
import { BiSearch, BiCalendar } from "react-icons/bi";
import { MdOutlineExplore } from "react-icons/md";
import { useFilterParams } from "@/app/hooks/useFilterParams";
import { useScrollCollapse } from "@/app/hooks/useScrollCollapse";
import { useSearchSuggestions } from "@/app/hooks/useSearchSuggestions";
import type { Suggestion } from "@/app/hooks/useSearchSuggestions";
import { saveDates, getStoredDates } from "@/app/lib/browseStorage";
import { useCartStore } from "@/stores/cartStore";
import { useUserDashboardStore } from "@/stores/userDashboardStore";
import styles from "./navHeader.module.css";


const COMPACT_SCROLL_THRESHOLD = 100;
const COMPACT_SCROLL_HYSTERESIS = 60;

interface NavHeaderProps {
	white?: boolean;
	filterControls?: React.ReactNode;
	mobileFilterButton?: React.ReactNode;
	activeFilters?: React.ReactNode;
	mobileMenuTrigger?: React.ReactNode;
	leftSlot?: React.ReactNode;
	mobileLeftSlot?: React.ReactNode;
}

const NavHeader = ({
	white = true,
	filterControls,
	mobileFilterButton,
	activeFilters,
	mobileMenuTrigger,
	leftSlot,
	mobileLeftSlot,
}: NavHeaderProps) => {
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
	const [searchOpen, setSearchOpen] = useState(false);
	const [datesOpen, setDatesOpen] = useState(false);
	const searchPillRef = useRef<HTMLDivElement>(null);
	const datesPillRef = useRef<HTMLDivElement>(null);
	const mobileSearchPillRef = useRef<HTMLDivElement>(null);
	const mobileDatesPillRef = useRef<HTMLDivElement>(null);
	const searchInputRef = useRef<HTMLInputElement>(null);
	const mobileSearchInputRef = useRef<HTMLInputElement>(null);

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

	const { role } = useUserDashboardStore();

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
	const isElevated = !isWhite && role === "ADMIN";
	const elevatedClass = isElevated ? styles.headerAdmin : "";

	const { suggestions, loadingSuggestions } = useSearchSuggestions(searchText);


	useEffect(() => {
		const handler = (e: MouseEvent) => {
			const t = e.target as Node;
			if (
				!searchPillRef.current?.contains(t) &&
				!mobileSearchPillRef.current?.contains(t)
			) setShowSuggestions(false);
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	const formatShortDate = (d: Date) =>
		d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

	const datesLabel =
		fromDate && untilDate
			? `${formatShortDate(fromDate)} – ${formatShortDate(untilDate)}`
			: fromDate
			? formatShortDate(fromDate)
			: "Dates";

	// Auto-focus search input when pill opens
	useEffect(() => {
		if (searchOpen) {
			searchInputRef.current?.focus();
			mobileSearchInputRef.current?.focus();
		}
	}, [searchOpen]);

	// Close search pill on outside click
	useEffect(() => {
		if (!searchOpen) return;
		const handler = (e: MouseEvent) => {
			const t = e.target as Node;
			if (!searchPillRef.current?.contains(t) && !mobileSearchPillRef.current?.contains(t)) {
				setSearchOpen(false);
				setShowSuggestions(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [searchOpen]);

	// Close dates pill on outside click (allow datepicker portals)
	useEffect(() => {
		if (!datesOpen) return;
		const handler = (e: MouseEvent) => {
			const t = e.target as Element;
			if (
				!datesPillRef.current?.contains(t) &&
				!mobileDatesPillRef.current?.contains(t) &&
				!t.closest("[data-datepicker-portal]")
			) {
				setDatesOpen(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [datesOpen]);

	const handleSearch = () => {
		setShowSuggestions(false);
		setHighlightedIndex(-1);
		setSearchOpen(false);
		if (pathname === "/browse") {
			set({ search: searchText || undefined });
		} else {
			const p = new URLSearchParams();
			if (searchText.trim()) p.set("search", searchText);
			router.push(`/browse${p.size ? `?${p}` : ""}`);
		}
	};

	const handleSuggestionClick = (s: Suggestion) => {
		const text = `${s.make} ${s.model}`;
		setSearchText(text);
		setShowSuggestions(false);
		setSearchOpen(false);
		if (pathname === "/browse") {
			set({ search: text });
		} else {
			const p = new URLSearchParams();
			p.set("search", text);
			router.push(`/browse?${p}`);
		}
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
			<button type="button" onClick={handleSearch} className={styles.searchBtn}>
				<BiSearch />
			</button>
		</div>
	);

	const separator = <div className={styles.separator} />;

	return (
		<div
			className={`${styles.header} ${isWhite ? styles.headerWhite : styles.headerCompact} ${elevatedClass}`}
		>
			{/* ── Main header row ── */}
			<div
				className={`${styles.mainRow} ${isWhite ? styles.mainRowWhite : styles.mainRowCompact}`}
			>
				{/* Mobile-only left slot (e.g. back chevron on car detail page) */}
				{!isWhite && mobileLeftSlot && (
					<div className={styles.mobileLeftSlot}>{mobileLeftSlot}</div>
				)}

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
						<Image width={50} height={50} src={smallLogo} alt="FCR Logo" loading="eager" />
					)}
				</Link>

				{/* Browse icon link — white mode only (compact mode has it inside the search group) */}
				{isWhite && (
					<Link href="/browse" className={`${styles.browseNavLink} ${styles.browseNavLinkWhite}`}>
						<MdOutlineExplore />
						<span className={styles.browseNavLinkText}>Browse Cars</span>
					</Link>
				)}

				{/* Desktop search pills (centered) */}
				{!isWhite && (
					<div className={`${styles.desktopSearch} ${mobileFilterButton ? styles.desktopSearchHideLg : styles.desktopSearchHideMd}`}>

						{/* Browse icon link */}
						<Link href="/browse" className={`${styles.browseNavLink} ${styles.browseNavLinkCompact}`}>
							<MdOutlineExplore />
							<span className={styles.browseNavLinkText}>Browse Cars</span>
						</Link>

						{/* Search pill */}
						<div ref={searchPillRef} className={`${styles.headerPill} ${searchOpen ? styles.headerPillOpen : ""}`}>
							<button
								type="button"
								onClick={() => { setSearchOpen(v => !v); setDatesOpen(false); }}
								className={styles.headerPillIcon}
							>
								<BiSearch />
								{!searchOpen && (
									<span className={`${styles.headerPillLabel} ${searchText ? styles.headerPillLabelActive : ""}`}>
										{searchText || "Search"}
									</span>
								)}
							</button>
							<div className={`${styles.headerPillBody} ${searchOpen ? styles.headerPillBodyOpen : ""}`}>
								<input
									ref={searchInputRef}
									placeholder="Make & model"
									value={searchText}
									onChange={(e) => { setSearchText(e.target.value); setShowSuggestions(true); }}
									onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
									onKeyDown={handleKeyDown}
									className={styles.headerPillInput}
								/>
							</div>
							{searchOpen && (
								<button type="button" onClick={handleSearch} className={styles.headerPillSubmit}>
									<BiSearch />
								</button>
							)}
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

						{/* Dates pill */}
						<div ref={datesPillRef} className={`${styles.headerPill} ${datesOpen ? styles.headerPillOpen : ""}`}>
							<button
								type="button"
								onClick={() => { setDatesOpen(v => !v); setSearchOpen(false); }}
								className={styles.headerPillIcon}
							>
								<BiCalendar />
								{!datesOpen && (
									<span className={styles.headerPillLabel}>
										{datesLabel}
										{hasCartDateConflict && (fromDate || untilDate) && (
											<span className={styles.dateDotInline} />
										)}
									</span>
								)}
							</button>
							<div className={`${styles.headerPillBody} ${datesOpen ? styles.headerPillBodyOpen : ""}`}>
								<div className={styles.headerPillDateGroup}>
									<p className={styles.headerPillDateLabel}>From</p>
									<DatePicker
										label="From"
										showLabel={false}
										placeholder="Add date"
										selected={fromDate}
										onSelect={handleFromDateChange}
										cartRanges={cartDateRanges}
										portal
									/>
								</div>
								<div className={styles.headerPillSep} />
								<div className={styles.headerPillDateGroup}>
									<p className={styles.headerPillDateLabel}>Until</p>
									<DatePicker
										label="Until"
										showLabel={false}
										placeholder="Add date"
										selected={untilDate}
										onSelect={(d) => { handleUntilDateChange(d); if (d) setDatesOpen(false); }}
										fromDate={fromDate}
										cartRanges={cartDateRanges}
										portal
									/>
								</div>
							</div>
						</div>

						{filterControls && (
							<div className={styles.filterControlsWrapper}>{filterControls}</div>
						)}
					</div>
				)}

				{/* Right side: menu button */}
				<div
					className={`${styles.rightSide} ${isWhite ? styles.rightSideWhite : styles.rightSideCompact}`}
				>
					<HeaderMenuButton />
					{mobileMenuTrigger}
				</div>
			</div>

			{/* ── Mobile search + filter row ── */}
			{!isWhite && mobileFilterButton && (
				<div className={`${styles.mobileRow} ${styles.mobileRowHideDesktop}`}>

					{/* Mobile search pill */}
					<div ref={mobileSearchPillRef} className={`${styles.headerPill} ${styles.headerPillMobile} ${searchOpen ? styles.headerPillOpen : ""}`}>
						<button
							type="button"
							onClick={() => { setSearchOpen(v => !v); setDatesOpen(false); }}
							className={styles.headerPillIcon}
						>
							<BiSearch />
							{!searchOpen && (
								<span className={`${styles.headerPillLabel} ${searchText ? styles.headerPillLabelActive : ""}`}>
									{searchText || "Search"}
								</span>
							)}
						</button>
						<div className={`${styles.headerPillBody} ${searchOpen ? styles.headerPillBodyOpen : ""}`}>
							<input
								ref={mobileSearchInputRef}
								placeholder="Make & model"
								value={searchText}
								onChange={(e) => { setSearchText(e.target.value); setShowSuggestions(true); }}
								onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
								onKeyDown={handleKeyDown}
								className={styles.headerPillInput}
							/>
						</div>
						{searchOpen && (
							<button type="button" onClick={handleSearch} className={styles.headerPillSubmit}>
								<BiSearch />
							</button>
						)}
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

					{/* Mobile dates pill */}
					<div ref={mobileDatesPillRef} className={`${styles.headerPill} ${styles.headerPillMobile} ${datesOpen ? styles.headerPillOpen : ""}`}>
						<button
							type="button"
							onClick={() => { setDatesOpen(v => !v); setSearchOpen(false); }}
							className={styles.headerPillIcon}
						>
							<BiCalendar />
							{!datesOpen && (
								<span className={styles.headerPillLabel}>
									{datesLabel}
									{hasCartDateConflict && (fromDate || untilDate) && (
										<span className={styles.dateDotInline} />
									)}
								</span>
							)}
						</button>
						<div className={`${styles.headerPillBody} ${datesOpen ? styles.headerPillBodyOpen : ""}`}>
							<div className={styles.headerPillDateGroup}>
								<p className={styles.headerPillDateLabel}>From</p>
								<DatePicker
									label="From"
									showLabel={false}
									placeholder="Add date"
									selected={fromDate}
									onSelect={handleFromDateChange}
									cartRanges={cartDateRanges}
									portal
								/>
							</div>
							<div className={styles.headerPillSep} />
							<div className={styles.headerPillDateGroup}>
								<p className={styles.headerPillDateLabel}>Until</p>
								<DatePicker
									label="Until"
									showLabel={false}
									placeholder="Add date"
									selected={untilDate}
									onSelect={(d) => { handleUntilDateChange(d); if (d) setDatesOpen(false); }}
									fromDate={fromDate}
									cartRanges={cartDateRanges}
									portal
								/>
							</div>
						</div>
					</div>

					{mobileFilterButton}
				</div>
			)}
		</div>
	);
};

export default NavHeader;
