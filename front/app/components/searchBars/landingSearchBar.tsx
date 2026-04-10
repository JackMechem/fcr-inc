"use client"

import Link from "next/link";
import { useState } from "react";
import { BiSearch } from "react-icons/bi";
import DatePicker from "@/app/components/DatePicker";

const LandingSearchBar = () => {
    const [searchText, setSearchText] = useState<string | null>(null);
    const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
    const [untilDate, setUntilDate] = useState<Date | undefined>(undefined);
	return (
		<div className="w-full flex flex-col md:px-0 px-[20px] items-center">
			<div className="flex md:flex-row md:w-auto w-full flex-col gap-[10px] h-auto md:p-[10px] p-[15px] md:pl-[25px] bg-primary md:rounded-full rounded-3xl shadow focus-within:border-accent duration-150">
				<div>
					<p className="text-[10pt]">What</p>
					<input
						placeholder="Make, model, or year"
                        onChange={(e) => setSearchText(e.target.value)}
						className="outline-none text-foreground"
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
				<Link href={"/browse?search=" + searchText} className="cursor-pointer flex justify-center items-center text-center md:h-fill md:py-0 md:mt-0 mt-[10px] py-[10px] px-[10px] text-[18pt] bg-accent text-primary rounded-full">
					<BiSearch />
				</Link>
			</div>
		</div>
	);
};

export default LandingSearchBar;
