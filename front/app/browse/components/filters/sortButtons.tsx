"use client";
import FilterBarDropdown from "./filterBarDropdown";
import { TbSortAZ, TbSortZA, TbSortAscendingNumbers, TbSortDescendingNumbers } from "react-icons/tb";
import { useFilterParams } from "./useFilterParams";
import styles from "./browseBar.module.css";

const NUMERIC_SORT_FIELDS = new Set([
	"modelYear", "pricePerDay", "cylinders", "gears", "horsepower", "seats", "torque", "mpg",
]);

function SortDirIcon({ sortBy, sortDir }: { sortBy: string; sortDir: string }) {
	const isDesc = sortDir === "desc";
	if (NUMERIC_SORT_FIELDS.has(sortBy)) {
		return isDesc ? <TbSortDescendingNumbers /> : <TbSortAscendingNumbers />;
	}
	return isDesc ? <TbSortZA /> : <TbSortAZ />;
}

const SortButtons = () => {
	const { get, set } = useFilterParams();
	const sortBy = get("sortBy") ?? "popularity";
	const sortDir = get("sortDir") ?? "asc";
	const isPopularity = sortBy === "popularity";

	return (
		<div className={styles.sortGroup}>
			{!isPopularity && (
				<button
					onClick={() => set({ sortDir: sortDir === "desc" ? "asc" : "desc" })}
					className={styles.sortDirBtn}
				>
					<SortDirIcon sortBy={sortBy} sortDir={sortDir} />
				</button>
			)}
			{get("sortBy") !== null && (
				<FilterBarDropdown
					key={get("sortBy") ?? "popularity"}
					label=""
					showAll={false}
					options={[
						{ paramId: "popularity", displayText: "Popularity" },
						{ paramId: "make", displayText: "Make" },
						{ paramId: "model", displayText: "Model" },
						{ paramId: "modelYear", displayText: "Model Year" },
						{ paramId: "pricePerDay", displayText: "Price/Day" },
						{ paramId: "cylinders", displayText: "Cylinders" },
						{ paramId: "gears", displayText: "Gears" },
						{ paramId: "horsepower", displayText: "Horsepower" },
						{ paramId: "seats", displayText: "Seats" },
						{ paramId: "torque", displayText: "Torque" },
						{ paramId: "mpg", displayText: "MPG" },
					]}
					defaultValue={get("sortBy") ?? "popularity"}
					onChange={(v) => {
						if (v === "popularity") {
							set({ sortBy: "popularity", sortDir: "desc" });
						} else {
							set({ sortBy: v ?? undefined });
						}
					}}
				/>
			)}
		</div>
	);
};

export default SortButtons;
