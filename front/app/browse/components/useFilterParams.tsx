"use client";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { CarApiParams } from "@/app/types/CarTypes";
import { useEffect, useState, useRef } from "react";

export const useFilterParams = () => {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const isExternalChange = useRef(false);

	const [params, setParams] = useState<Partial<CarApiParams>>(
		() => Object.fromEntries(searchParams.entries()) as Partial<CarApiParams>,
	);

	// Sync state when URL changes externally (e.g. browser back/forward)
	useEffect(() => {
		if (isExternalChange.current) {
			isExternalChange.current = false;
			return;
		}
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setParams(
			Object.fromEntries(searchParams.entries()) as Partial<CarApiParams>,
		);
	}, [searchParams.toString()]);

	// Push to URL whenever state changes
	useEffect(() => {
		const urlParams = new URLSearchParams();
		for (const [key, value] of Object.entries(params)) {
			if (value != null && value !== "") urlParams.set(key, value.toString());
		}
		if (urlParams.toString() === searchParams.toString()) return;
		isExternalChange.current = true;
		router.push(`${pathname}?${urlParams.toString()}`);
	}, [params]);

	const get = (key: keyof CarApiParams) => params[key]?.toString();

	const set = (updates: Partial<CarApiParams>) => {
		setParams((prev) => {
			const next = { ...prev };
			for (const [key, value] of Object.entries(updates)) {
				if (value == null || value === "")
					delete next[key as keyof CarApiParams];
				else (next as Record<string, unknown>)[key] = value;
			}
			return next;
		});
	};

	const remove = (key: keyof CarApiParams) => {
		setParams((prev) => {
			const next = { ...prev };
			delete next[key];
			return next;
		});
	};

	const clear = () => setParams({});
	const getAll = () => params;

	return { get, set, remove, clear, getAll, params, pathname };
};
