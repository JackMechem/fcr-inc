"use client";
import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import bigLogoImageWhite from "../../media/bigLogoWhite.svg";
import smallLogo from "../../media/smallLogo.svg";
import HeaderMenuButton from "../buttons/headerMenuButton";
import SmallSearchBar from "../searchBars/smallSearchBar";
import { useScrollCollapse } from "@/app/hooks/useScrollCollapse";

const THRESHOLD = 30;
const HYSTERESIS = 30;

interface CollapsingHeaderProps {
	white?: boolean;
}

/**
 * A header that starts expanded (white logo, no background) and collapses
 * into a compact bar with a search bar once the user scrolls past `THRESHOLD`.
 *
 * Replaces the old `LandingHeader` and `BrowseHeader` which were identical.
 */
const CollapsingHeader = ({ white = true }: CollapsingHeaderProps) => {
	const logoLinkRef = useRef<HTMLAnchorElement>(null);
	const isExpanded = useScrollCollapse(white, THRESHOLD, HYSTERESIS);
	const isWhite = white && isExpanded;

	return (
		<div
			className={`relative sticky z-1 float-top top-0 flex items-center justify-between duration-[200ms] ${
				!isWhite
					? "bg-primary/90 shadow-md shadow-third/10 border-third top-[0px] h-[72px] py-[8px] pl-[8px] pr-[20px] backdrop-blur-md"
					: "md:px-[100px] px-[40px] md:py-[20px] py-0 border border-transparent"
			}`}
		>
			<Link ref={logoLinkRef} href="/">
				{isWhite ? (
					<Image
						width={200}
						height={400}
						src={bigLogoImageWhite}
						className="h-full"
						alt="FCR Logo"
					/>
				) : (
					<Image width={55} height={55} src={smallLogo} alt="FCR Logo" />
				)}
			</Link>
			{!isWhite && <SmallSearchBar />}
			<div
				className={`${isWhite ? "text-primary" : "text-accent"} text-[20pt] duration-300`}
			>
				<HeaderMenuButton />
			</div>
		</div>
	);
};

export default CollapsingHeader;
