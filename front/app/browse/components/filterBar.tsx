"use client";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import FilterBarDropdown from "./filterBarDropdown";
import FilterBarYearRange from "./filterBarYearSelect";
import { BiRefresh } from "react-icons/bi";
import FilterBarInput from "./filterBarInput";
import FilterBarNumberRange from "./filterBarNumberRange";
import FilterButton from "./filterButton";
import ActiveFilters from "./activeFilters";
import SortButtons from "./sortButtons";

export interface FilterAndSelectFields {
	page?: string;
	pageSize?: string;
	select?: string;
	sortBy?: string;
	sortDir?: string;
	make?: string;
	model?: string;
	modelYear?: string;
	minModelYear?: string;
	maxModelYear?: string;
	transmission?: string;
	drivetrain?: string;
	engineLayout?: string;
	fuel?: string;
	bodyType?: string;
	roofType?: string;
	vehicleClass?: string;
	minHorsepower?: number;
	maxHorsepower?: number;
}

const FilterBar = () => {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const get = (key: keyof FilterAndSelectFields) =>
		searchParams.get(key) ?? undefined;

	const applyParam = (
		param: keyof FilterAndSelectFields,
		value: string | null,
	) => {
		const params = new URLSearchParams(searchParams.toString());
		if (value) params.set(param, value);
		else params.delete(param);
		router.push(`${pathname}?${params.toString()}`);
	};

	const applyMultiple = (updates: Partial<FilterAndSelectFields>) => {
		const params = new URLSearchParams(searchParams.toString());
		for (const [key, value] of Object.entries(updates)) {
			if (value) params.set(key, value.toString());
			else params.delete(key);
		}
		router.push(`${pathname}?${params.toString()}`);
	};

	return (
		<div className="w-full bg-primary border-y border-y-third shadow-sm shadow-third/30 p-[10px] text-foreground flex gap-[15px] items-stretch justify-start h-fit sticky float-top top-[72px] relative">
                <ActiveFilters className="self-center h-full" />

			<div className="flex gap-[10px] ml-auto w-full h-full items-center justify-end">
                <SortButtons />
				<FilterButton />
			</div>
		</div>
	);
};

export default FilterBar;
