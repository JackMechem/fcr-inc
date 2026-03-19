"use client";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import FilterButton from "./filterButton";
import ActiveFilters from "./activeFilters";
import SortButtons from "./sortButtons";
import { FilterAndSelectFields } from "@/app/types/CarTypes";

const FilterBar = () => {

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
