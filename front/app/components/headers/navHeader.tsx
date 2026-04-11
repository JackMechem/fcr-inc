"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import bigLogoImageWhite from "../../media/bigLogoWhite.svg";
import smallLogo from "../../media/smallLogo.svg";
import HeaderMenuButton from "../buttons/headerMenuButton";
import DatePicker from "../DatePicker";
import { BiSearch } from "react-icons/bi";
import { useFilterParams } from "@/app/browse/components/useFilterParams";

const COMPACT_SCROLL_THRESHOLD = 100;
const COMPACT_SCROLL_HYSTERESIS = 60;

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const AUTH = "Basic " + btoa("jim:intentionallyInsecurePassword#3");

interface Suggestion { vin: string; make: string; model: string; }

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
	const [isExpanded, setIsExpanded] = useState(true);
	const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
	const [untilDate, setUntilDate] = useState<Date | undefined>(undefined);
	const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [loadingSuggestions, setLoadingSuggestions] = useState(false);
	const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
	const searchBarRef = useRef<HTMLDivElement>(null);
	const lastRequestTime = useRef(0);
	const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const router = useRouter();
	const pathname = usePathname();
	const { set, params } = useFilterParams();

	const [searchText, setSearchText] = useState(() => params.search?.toString() ?? "");
	const prevParamSearch = useRef(params.search?.toString() ?? "");

	const paramSearch = params.search?.toString() ?? "";
	if (paramSearch !== prevParamSearch.current) {
		prevParamSearch.current = paramSearch;
		setSearchText(paramSearch);
	}

	const isWhite = white && isExpanded;

	useEffect(() => {
		if (!white) return;
		const handleScroll = () => {
			const y = window.scrollY;
			setIsExpanded((prev) => {
				if (prev && y >= COMPACT_SCROLL_THRESHOLD) return false;
				if (!prev && y <= COMPACT_SCROLL_THRESHOLD - COMPACT_SCROLL_HYSTERESIS)
					return true;
				return prev;
			});
		};
		handleScroll();
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, [white]);

	// Suggestions fetch with 1 s cooldown between requests
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
				const res = await fetch(`${API_BASE}/cars?${p}`, {
					headers: { Authorization: AUTH },
				});
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

		return () => {
			if (pendingTimer.current) clearTimeout(pendingTimer.current);
		};
	}, [searchText]);

	// Close suggestions on outside click
	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (searchBarRef.current && !searchBarRef.current.contains(e.target as Node))
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
			if (highlightedIndex >= 0) {
				handleSuggestionClick(suggestions[highlightedIndex]);
			} else {
				handleSearch();
			}
		} else if (e.key === "Escape") {
			setShowSuggestions(false);
			setHighlightedIndex(-1);
		}
	};

	const handleSuggestionClick = (s: Suggestion) => {
		setSearchText(`${s.make} ${s.model}`);
		setShowSuggestions(false);
	};

	const suggestionDropdown = showSuggestions && (loadingSuggestions || suggestions.length > 0) && (
		<div className="absolute top-full left-0 right-0 mt-2 bg-primary border border-third rounded-2xl shadow-xl overflow-hidden z-50">
			{loadingSuggestions ? (
				<div className="flex items-center justify-center py-[14px]">
					<div className="w-[18px] h-[18px] rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
				</div>
			) : (
				suggestions.map((s, i) => (
					<button
						key={s.vin}
						onMouseDown={(e) => {
							e.preventDefault();
							handleSuggestionClick(s);
						}}
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
	);

	const searchButton = (
		<button
			onClick={handleSearch}
			className="flex-shrink-0 flex items-center justify-center w-[34px] h-[34px] text-[15pt] bg-accent text-primary rounded-full cursor-pointer hover:brightness-110 transition"
		>
			<BiSearch />
		</button>
	);

	const separator = (
		<div className="w-[1px] h-[28px] bg-third/50 self-center flex-shrink-0" />
	);

	return (
		<div
			className={`sticky top-0 z-[10] transition-all duration-200 [overflow-anchor:none] ${
				isWhite
					? "border border-transparent"
					: "bg-primary backdrop-blur-md border-b border-third/30 shadow-sm h-auto"
			}`}
		>
			{/* ── Main header row ── */}
			<div
				className={`flex items-center gap-3 mb-0 h-full py-[10px] ${
					isWhite
						? "md:px-[100px] px-[40px] md:py-[20px] py-3"
						: "h-[64px] px-4"
				}`}
			>
				{/* Logo */}
				<Link href="/" className="flex-shrink-0">
					{isWhite ? (
						<Image
							width={200}
							height={60}
							src={bigLogoImageWhite}
							alt="FCR Logo"
						/>
					) : (
						<Image width={50} height={50} src={smallLogo} alt="FCR Logo" />
					)}
				</Link>

				{/* Desktop search bar */}
				{!isWhite && (
					<div
						ref={searchBarRef}
						className={`relative flex-1 max-w-[500px] ${
							mobileFilterButton ? "lg:flex hidden" : "md:flex hidden"
						} items-center gap-3 bg-primary border border-third rounded-full pl-5 pr-[5px] h-[48px] focus-within:border-accent duration-150`}
					>
						<div className="flex-1 min-w-0">
							<p className="text-[9pt] text-foreground/50 leading-none mb-[2px]">
								What
							</p>
							<input
								placeholder="Make & model"
								value={searchText}
								onChange={(e) => {
									setSearchText(e.target.value);
									setShowSuggestions(true);
								}}
								onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
								onKeyDown={handleKeyDown}
								className="outline-none text-foreground w-full text-sm leading-none"
							/>
						</div>
						{separator}
						<div className="w-[110px] flex-shrink-0">
							<p className="text-[9pt] text-foreground/50 leading-none mb-[2px]">
								From
							</p>
							<DatePicker
								label="From"
								showLabel={false}
								selected={fromDate}
								onSelect={(d) => {
									setFromDate(d);
									if (untilDate && d && d > untilDate) setUntilDate(undefined);
								}}
							/>
						</div>
						{separator}
						<div className="w-[100px] flex-shrink-0">
							<p className="text-[9pt] text-foreground/50 leading-none mb-[2px]">
								Until
							</p>
							<DatePicker
								label="Until"
								showLabel={false}
								selected={untilDate}
								onSelect={setUntilDate}
								fromDate={fromDate}
							/>
						</div>
						{searchButton}
						{suggestionDropdown}
					</div>
				)}

				{!isWhite && filterControls && (
					<div className="lg:flex hidden items-center h-full justify-center mr-auto">
						{filterControls}
					</div>
				)}

				{/* Right side: menu button */}
				<div
					className={`flex items-center h-full gap-1 flex-shrink-0 ml-auto ${
						isWhite ? "text-primary" : "text-accent"
					} text-[20pt]`}
				>
					<HeaderMenuButton />
				</div>
			</div>

			{/* ── Mobile search + filter row ── */}
			{!isWhite && mobileFilterButton && (
				<div className="lg:hidden flex items-center gap-2 px-3 pb-3">
					<div
						ref={searchBarRef}
						className="relative flex items-center gap-2 bg-primary border border-third rounded-full pl-4 pr-1 h-[44px] focus-within:border-accent duration-150 w-full"
					>
						<input
							placeholder="Make & model"
							value={searchText}
							onChange={(e) => {
								setSearchText(e.target.value);
								setShowSuggestions(true);
							}}
							onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
							onKeyDown={handleKeyDown}
							className="outline-none text-foreground flex-1 min-w-0 text-sm w-full"
						/>
						<div className="w-[1px] h-[24px] bg-third/50 flex-shrink-0" />
						<div className="flex-shrink-0">
							<DatePicker
								label="From"
								showLabel={false}
								placeholder="From"
								selected={fromDate}
								onSelect={(d) => {
									setFromDate(d);
									if (untilDate && d && d > untilDate) setUntilDate(undefined);
								}}
							/>
						</div>
						<div className="w-[1px] h-[24px] bg-third/50 flex-shrink-0" />
						<div className="flex-shrink-0">
							<DatePicker
								label="Until"
								showLabel={false}
								placeholder="Until"
								selected={untilDate}
								onSelect={setUntilDate}
								fromDate={fromDate}
							/>
						</div>
						{searchButton}
						{suggestionDropdown}
					</div>
                    {mobileFilterButton}
				</div>
			)}
		</div>
	);
};

export default NavHeader;
