import FilterButton from "./filterButton";
import ActiveFilters from "./activeFilters";
import SortButtons from "./sortButtons";
import { getAllEnums } from "@/app/lib/EnumApi";
import { CarEnums } from "@/app/types/CarEnums";

const FilterBar = async () => {
    const enums: CarEnums = await getAllEnums();

	return (
		<div className="w-full bg-primary border-y border-y-third shadow-sm shadow-third/30 p-[10px] text-foreground flex gap-[15px] items-stretch justify-start h-fit sticky float-top top-[72px] relative z-1">
                <ActiveFilters className="self-center h-full" />
			<div className="flex gap-[10px] ml-auto w-full h-full items-center justify-end">
                <SortButtons />
				<FilterButton enums={enums} />
			</div>
		</div>
	);
};

export default FilterBar;
