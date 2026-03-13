"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import bigLogoImageWhite from "../../media/bigLogoWhite.svg";
import bigLogoImageRed from "../../media/bigLogo.svg";
import smallLogo from "../../media/smallLogo.svg";
import HeaderMenuButton from "../buttons/headerMenuButton";
import Link from "next/link";
import CartButton from "../buttons/cartButton";
import SmallSearchBar from "../searchBars/smallSearchBar";

const LandingHeader = ({ white = false }: { white?: boolean }) => {
	const [isOverRed, setIsOverRed] = useState(false);
	const sentinelRef = useRef<HTMLAnchorElement>(null);

	useEffect(() => {
		const hero = document.getElementById("hero-section");
		if (!hero) {
			return;
		}

		const observer = new IntersectionObserver(
			([entry]) => setIsOverRed(entry.isIntersecting),
			{ threshold: 0, rootMargin: "-300px 0px 0px 0px" },
		);
		observer.observe(hero);
		return () => observer.disconnect();
	}, []);

	const isWhite = isOverRed;

	return (
		<>
			<div
				className={`relative sticky z-1 float-top top-0 flex items-center justify-between duration-[200ms] ${!isWhite ? "bg-primary/70 shadow-md m-[10px] rounded-full border border-third top-[10px] h-fit py-[8px] pl-[8px] pr-[20px] backdrop-blur-md" : "md:px-[100px] px-[40px] md:py-[20px] py-0"}`}
			>
				<Link ref={sentinelRef} href={"/"}>
					{isWhite ? (
						<Image
							width={200}
							height={400}
							src={bigLogoImageWhite}
							className="h-full"
							alt={"Header Logo"}
						/>
					) : (
						<Image
							width={55}
							height={55}
							src={smallLogo}
							alt={"Header Logo"}
						/>
					)}
				</Link>
				{!isWhite && <SmallSearchBar />}
				<div
					className={`${isWhite ? "text-primary" : "text-accent"} text-[20pt]  duration-300`}
				>
					<HeaderMenuButton />
				</div>
			</div>
		</>
	);
};
export default LandingHeader;
