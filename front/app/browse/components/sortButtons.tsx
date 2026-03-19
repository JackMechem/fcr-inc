"use client";

import FilterBarDropdown from "./filterBarDropdown";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { FilterAndSelectFields } from "./filterBar";
import { useEffect, useState } from "react";
import { PiSortAscending, PiSortDescending } from "react-icons/pi";

const SortButtons = () => {
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

	const [sortDirAsc, setSortDirAsc] = useState<boolean>(
		get("sortDir")?.toLowerCase() == "desc" ? false : true,
	);

	useEffect(() => {
		applyParam("sortDir", sortDirAsc ? "ASC" : "DESC");
	}, [sortDirAsc]);

	const handleSortDirChange = () => {
		setSortDirAsc(!sortDirAsc);
	};

	return (
		<div className="flex gap-[0px]  border-transparent hover:border-third/50 hover:bg-primary-dark rounded-xl p-[5px] items-stretch">
			<button
				onClick={handleSortDirChange}
				className="text-foreground flex items-center justify-center w-auto px-[6px] mr-[-10px] z-1 h-auto rounded-xl hover:bg-accent/10 text-[18pt] border border-transparent cursor-pointer duration-[200ms]"
			>
				{sortDirAsc == true ? <PiSortDescending /> : <PiSortAscending />}
			</button>
			<FilterBarDropdown
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
				onChange={(v) => applyParam("sortBy", v)}
			/>
		</div>
	);
};

export default SortButtons;
