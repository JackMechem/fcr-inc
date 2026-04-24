"use client";
import { useState, useEffect, useRef } from "react";
import { browserApi } from "@/app/lib/fcr-client";

export interface Suggestion {
	vin: string;
	make: string;
	model: string;
}

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
			const results = await browserApi.cars.suggest(searchText);
			setSuggestions(results);
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
