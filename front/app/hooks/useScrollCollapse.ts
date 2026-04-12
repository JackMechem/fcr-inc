"use client";
import { useState, useEffect } from "react";

/**
 * Returns whether the header is in its expanded (non-collapsed) state,
 * based on the user's scroll position.
 *
 * @param enabled   - Only track scroll when true (e.g. `white` prop on headers)
 * @param threshold - Scroll Y at which to collapse
 * @param hysteresis - How far back up to scroll before re-expanding
 */
export const useScrollCollapse = (
	enabled: boolean,
	threshold: number,
	hysteresis: number,
): boolean => {
	const [isExpanded, setIsExpanded] = useState(true);

	useEffect(() => {
		if (!enabled) return;
		const handleScroll = () => {
			const y = window.scrollY;
			setIsExpanded((prev) => {
				if (prev && y >= threshold) return false;
				if (!prev && y <= threshold - hysteresis) return true;
				return prev;
			});
		};
		handleScroll();
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, [enabled, threshold, hysteresis]);

	return isExpanded;
};
