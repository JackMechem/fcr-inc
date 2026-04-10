"use client";

import { useState, useEffect } from "react";
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

interface NavHeaderProps {
	white?: boolean;
	/** Sort + full filter controls — shown on desktop in the header row (browse page) */
	filterControls?: React.ReactNode;
	/** Just the filter button — shown on mobile next to the search row (browse page) */
	mobileFilterButton?: React.ReactNode;
	/** Active filter pills — shown as a sub-row inside the sticky header */
	activeFilters?: React.ReactNode;
}

const NavHeader = ({
	white = true,
	filterControls,
	mobileFilterButton,
	activeFilters,
}: NavHeaderProps) => {
	const [isExpanded, setIsExpanded] = useState(true);
	const [searchText, setSearchText] = useState("");
	const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
	const [untilDate, setUntilDate] = useState<Date | undefined>(undefined);

	const router = useRouter();
	const pathname = usePathname();
	const { set } = useFilterParams();

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

	const handleSearch = () => {
		if (!searchText.trim()) return;
		if (pathname === "/browse") {
			set({ search: searchText });
		} else {
			router.push(`/browse?search=${encodeURIComponent(searchText)}`);
		}
	};

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

				{/* Desktop search bar — hidden on mobile when a mobile row is provided */}
				{!isWhite && (
					<div
						className={`flex-1 max-w-[500px] ${
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
								onChange={(e) => setSearchText(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleSearch()}
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
					</div>
				)}

				{!isWhite && filterControls && (
					<div className="lg:flex hidden items-center h-full justify-center mr-auto">
						{filterControls}
					</div>
				)}

				{/* Right side: desktop filter controls + menu button */}
				<div
					className={`flex items-center h-full gap-1 flex-shrink-0 ml-auto ${
						isWhite ? "text-primary" : "text-accent"
					} text-[20pt]`}
				>
					<HeaderMenuButton />
				</div>
			</div>

			{/* ── Mobile search + filter row (browse page only) ── */}
			{!isWhite && mobileFilterButton && (
				<div className="lg:hidden flex items-center gap-2 px-3 pb-3">
					<div className="flex items-center gap-2 bg-primary border border-third rounded-full pl-4 pr-1 h-[44px] focus-within:border-accent duration-150 w-full">
						<input
							placeholder="Make & model"
							value={searchText}
							onChange={(e) => setSearchText(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleSearch()}
							className="outline-none text-foreground flex-1 min-w-0 text-sm  w-full"
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
					</div>
                    {mobileFilterButton}
				</div>
			)}
		</div>
	);
};

export default NavHeader;
