"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import bigLogoImageWhite from "../../media/bigLogoWhite.svg";
import smallLogo from "../../media/smallLogo.svg";
import HeaderMenuButton from "../buttons/headerMenuButton";
import Link from "next/link";
import SmallSearchBar from "../searchBars/smallSearchBar";
import FilterButton from "@/app/browse/components/filterButton";

const COMPACT_SCROLL_THRESHOLD = 30;
const COMPACT_SCROLL_HYSTERESIS = 30;

const BrowseHeader = ({ white = true }: { white?: boolean }) => {
	const [isExpanded, setIsExpanded] = useState(true);
	const logoLinkRef = useRef<HTMLAnchorElement>(null);

	useEffect(() => {
		if (white === true) {
			const handleScroll = () => {
				const y = window.scrollY;
				setIsExpanded((prev) => {
					if (prev && y >= COMPACT_SCROLL_THRESHOLD) return false;
					if (
						!prev &&
						y <= COMPACT_SCROLL_THRESHOLD - COMPACT_SCROLL_HYSTERESIS
					)
						return true;
					return prev;
				});
			};
			handleScroll();
			window.addEventListener("scroll", handleScroll, { passive: true });
			return () => window.removeEventListener("scroll", handleScroll);
		}
	}, []);

	const isWhite = white && isExpanded;

	return (
		<>
			<div
				className={`relative sticky z-1 float-top top-0 flex items-center justify-between duration-[200ms] ${!isWhite ? "bg-primary/90 shadow-md shadow-third/10 border-third top-[0px] h-[72px] py-[8px] pl-[8px] pr-[20px] backdrop-blur-md" : "md:px-[100px] px-[40px] md:py-[20px] py-0 border border-transparent"}`}
			>
				<Link ref={logoLinkRef} href={"/"}>
					{isWhite ? (
						<Image
							width={200}
							height={400}
							src={bigLogoImageWhite}
							className="h-full"
							alt={"Header Logo"}
						/>
					) : (
						<Image width={55} height={55} src={smallLogo} alt={"Header Logo"} />
					)}
				</Link>
				{!isWhite && (
						<SmallSearchBar />
				)}
				<div
					className={`${isWhite ? "text-primary" : "text-accent"} text-[20pt] duration-300`}
				>
					<HeaderMenuButton />
				</div>
			</div>
		</>
	);
};
export default BrowseHeader;
