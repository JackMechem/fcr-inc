"use client"

import { useFilterParams } from "@/app/browse/components/useFilterParams";
import { useState } from "react";
import { BiSearch } from "react-icons/bi";
import DatePicker from "@/app/components/DatePicker";

const SmallSearchBar = () => {
    const [searchText, setSearchText] = useState<string | null>(null);
    const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
    const [untilDate, setUntilDate] = useState<Date | undefined>(undefined);
    const { params, set, remove } = useFilterParams();
	return (
		<div className="w-auto flex flex-col flex-shrink px-0 items-center ">
			<div className="lg:flex hidden flex-row w-fit gap-[10px] h-auto p-[5px] pl-[20px] bg-primary/80 border border-third rounded-full focus-within:border-accent focus-within:scale-[101%] duration-150">
				<div className="w-[165px]">
					<p className="text-[10pt]">What</p>
					<input
						placeholder="Make, model, or year"
                        onChange={(e) => setSearchText(e.target.value)}
						className="outline-none text-foreground w-full min-w-full"
					/>
				</div>
				<div className="w-[120px]">
					<DatePicker
						label="From"
						selected={fromDate}
						onSelect={(date) => {
							setFromDate(date);
							if (untilDate && date && date > untilDate) setUntilDate(undefined);
						}}
					/>
				</div>
				<div className="w-[120px]">
					<DatePicker
						label="Until"
						selected={untilDate}
						onSelect={setUntilDate}
						fromDate={fromDate}
					/>
				</div>
				<div onClick={() => searchText && set({ search: searchText })} className="cursor-pointer flex justify-center items-center text-center md:h-fill md:py-0 md:mt-0 mt-[10px] py-[10px] px-[10px] text-[18pt] bg-accent text-primary rounded-full">
					<BiSearch />
				</div>
			</div>
		</div>
	);
};

export default SmallSearchBar;
