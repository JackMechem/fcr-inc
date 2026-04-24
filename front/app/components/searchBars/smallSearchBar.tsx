"use client"

import { useFilterParams } from "@/app/browse/components/filters/useFilterParams";
import { useState } from "react";
import { BiSearch } from "react-icons/bi";
import DatePicker from "@/app/components/DatePicker";
import styles from "./smallSearchBar.module.css";

const SmallSearchBar = () => {
    const [searchText, setSearchText] = useState<string | null>(null);
    const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
    const [untilDate, setUntilDate] = useState<Date | undefined>(undefined);
    const { set } = useFilterParams();

	return (
		<div className={styles.outer}>
			<div className={styles.bar}>
				<div className={styles.fieldSlot}>
					<p className={styles.fieldLabel}>What</p>
					<input
						placeholder="Make, model, or year"
                        onChange={(e) => setSearchText(e.target.value)}
						className={styles.input}
					/>
				</div>
				<div className={styles.datepickerSlot}>
					<DatePicker
						label="From"
						selected={fromDate}
						onSelect={(date) => {
							setFromDate(date);
							if (untilDate && date && date > untilDate) setUntilDate(undefined);
						}}
					/>
				</div>
				<div className={styles.datepickerSlot}>
					<DatePicker
						label="Until"
						selected={untilDate}
						onSelect={setUntilDate}
						fromDate={fromDate}
					/>
				</div>
				<div
					onClick={() => searchText && set({ search: searchText })}
					className={styles.searchBtn}
				>
					<BiSearch />
				</div>
			</div>
		</div>
	);
};

export default SmallSearchBar;
