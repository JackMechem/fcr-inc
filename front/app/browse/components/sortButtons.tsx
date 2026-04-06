"use client";
import FilterBarDropdown from "./filterBarDropdown";
import { PiSortAscending, PiSortDescending } from "react-icons/pi";
import { useFilterParams } from "./useFilterParams";

const SortButtons = () => {
	const { get, set } = useFilterParams();

	return (
		<div className="flex gap-[0px] border-transparent hover:border-third/50 hover:bg-primary-dark rounded-xl p-[5px] items-stretch">
			<button
				key={get("sortDir") ?? "asc"}
				onClick={() => {
					set({ sortDir: get("sortDir") == "desc" ? "asc" : "desc" });
				}}
				className="text-foreground flex items-center justify-center w-auto px-[6px] mr-[-10px] z-1 h-auto rounded-xl hover:bg-accent/10 text-[18pt] border border-transparent cursor-pointer duration-[200ms]"
			>
				{get("sortDir") == "desc" ? (
					<>
						<PiSortAscending />
					</>
				) : (
					<>
						<PiSortDescending />
					</>
				)}
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
