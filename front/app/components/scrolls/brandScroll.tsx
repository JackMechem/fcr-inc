"use client";
import { ReactNode, useRef, useState, useEffect } from "react";
const BrandScroll = ({ children }: { children: ReactNode }) => {
	const scrollRef = useRef<HTMLDivElement>(null);
	const directionRef = useRef<number>(1);
	const hoveredRef = useRef<boolean>(false);

	const scroll = (direction: number, duration = 1000) => {
		if (!scrollRef.current) return;
		const el = scrollRef.current;
		const firstChild = el.firstElementChild as HTMLElement | null;
		const scrollAmount = (firstChild ? firstChild.offsetWidth + 15 : 300) * direction;
		const start = el.scrollLeft;
		const startTime = performance.now();
		const ease = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
		const step = (now: number) => {
			const elapsed = now - startTime;
			const progress = Math.min(elapsed / duration, 1);
			el.scrollLeft = start + scrollAmount * ease(progress);
			if (progress < 1) requestAnimationFrame(step);
		};
		requestAnimationFrame(step);
	};

	useEffect(() => {
		const interval = setInterval(() => {
			if (hoveredRef.current || !scrollRef.current) return;
			const el = scrollRef.current;
			const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
			const atStart = el.scrollLeft <= 2;
			if (atEnd) directionRef.current = -1;
			if (atStart) directionRef.current = 1;
			scroll(directionRef.current);
		}, 4000);
		return () => clearInterval(interval);
	}, []);
	return (
		<div
			ref={scrollRef}
			onMouseEnter={() => {  hoveredRef.current = true; }}
			onMouseLeave={() => {  hoveredRef.current = false; }}
			className="relative flex gap-[15px] p-[10px] w-full overflow-x-scroll scrollbar-hide"
		>
			{children}
		</div>
	);
};
export default BrandScroll;
