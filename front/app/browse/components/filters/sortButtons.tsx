"use client";
import FilterBarDropdown from "./filterBarDropdown";
import { PiSortAscending, PiSortDescending } from "react-icons/pi";
import { useFilterParams } from "./useFilterParams";
import styles from "./browseBar.module.css";

const SortButtons = () => {
	const { get, set } = useFilterParams();

	return (
		<div className={styles.sortGroup}>
			<button
				key={get("sortDir") ?? "asc"}
				onClick={() => {
					set({ sortDir: get("sortDir") == "desc" ? "asc" : "desc" });
				}}
				className={styles.sortDirBtn}
			>
				{get("sortDir") == "desc" ? <PiSortAscending /> : <PiSortDescending />}
			</button>
			{get("sortBy") !== null && (
				<FilterBarDropdown
					key={get("sortBy") ?? "make"}
					label=""
					showAll={false}
					options={[
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
					defaultValue={get("sortBy") ?? "make"}
					onChange={(v) => set({ sortBy: v ?? undefined })}
				/>
			)}
		</div>
	);
};

export default SortButtons;
