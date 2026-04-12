"use client";
import { useState, useEffect, useRef } from "react";

export interface Suggestion {
	vin: string;
	make: string;
	model: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

/**
 * Fetches car suggestions as the user types, with a 1-second cooldown
 * between requests to avoid hammering the API.
 */
export const useSearchSuggestions = (searchText: string) => {
	const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
	const [loadingSuggestions, setLoadingSuggestions] = useState(false);
	const lastRequestTime = useRef(0);
	const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
				const p = new URLSearchParams({
					search: searchText,
					select: "vin,make,model",
					pageSize: "6",
				});
				const res = await fetch(`${API_BASE}/cars?${p}`);
				if (res.ok) {
					const data = await res.json();
					setSuggestions(data.data ?? []);
				}
			} catch {
				/* ignore network errors */
			}
			setLoadingSuggestions(false);
		};

		const elapsed = !searchText.trim()
			? 0
			: Date.now() - lastRequestTime.current >= 1000
				? 0
				: 1000 - (Date.now() - lastRequestTime.current);

		pendingTimer.current = setTimeout(doFetch, elapsed);
		return () => {
			if (pendingTimer.current) clearTimeout(pendingTimer.current);
		};
	}, [searchText]);

	return { suggestions, loadingSuggestions, setSuggestions };
};
