"use client";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import FilterBarDropdown from "./filterBarDropdown";
import FilterBarYearRange from "./filterBarYearSelect";
import { BiRefresh } from "react-icons/bi";
import FilterBarInput from "./filterBarInput";

interface FilterAndSelectFields {
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
}

const FilterBar = () => {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const get = (key: keyof FilterAndSelectFields) =>
		searchParams.get(key) ?? undefined;
	const [pendingParams, setPendingParams] = useState<
		Partial<FilterAndSelectFields>
	>({});

	const setPending = (
		param: keyof FilterAndSelectFields,
		value: string | null,
	) => {
		setPendingParams((prev) => ({ ...prev, [param]: value ?? undefined }));
	};

	const applyFilters = () => {
		const params = new URLSearchParams(searchParams.toString());
		for (const [key, value] of Object.entries(pendingParams)) {
			if (value) params.set(key, value);
			else params.delete(key);
		}
		router.push(`${pathname}?${params.toString()}`);
	};

	return (
		<div className="w-full bg-primary border-y border-y-third shadow-sm shadow-third/30 p-[10px] text-foreground flex gap-[10px] items-center justify-start">
			<FilterBarInput
				label="Make"
				paramId="make"
				defaultValue={get("make")}
				onChange={(v) => setPending("make", v ?? "")}
			/>
			<FilterBarInput
				label="Model"
				paramId="model"
				defaultValue={get("model")}
				onChange={(v) => setPending("model", v ?? "")}
			/>
			<FilterBarYearRange
				defaultMin={get("minModelYear")}
				defaultMax={get("maxModelYear")}
				onChange={(min, max) => {
					setPending("minModelYear", min);
					setPending("maxModelYear", max);
				}}
			/>
			<FilterBarDropdown
				label="Transmission"
				options={[
					{ paramId: "MANUAL", displayText: "Manual" },
					{ paramId: "AUTOMATIC", displayText: "Automatic" },
				]}
				onChange={(v) => setPending("transmission", v)}
			/>
			<FilterBarDropdown
				label="Engine Layout"
				options={[
					{ paramId: "V", displayText: "V" },
					{ paramId: "INLINE", displayText: "Inline" },
					{ paramId: "FLAT", displayText: "Flat" },
					{ paramId: "SINGLE_MOTOR", displayText: "Single Motor" },
					{ paramId: "DUAL_MOTOR", displayText: "Dual Motor" },
				]}
				onChange={(v) => setPending("engineLayout", v)}
			/>

			<FilterBarDropdown
				label="Drivetrain"
				options={[
					{ paramId: "FWD", displayText: "Front Wheel Drive" },
					{ paramId: "RWD", displayText: "Rear Wheel Drive" },
					{ paramId: "AWD", displayText: "All Wheel Drive" },
				]}
				onChange={(v) => setPending("drivetrain", v)}
			/>
			<div className="flex gap-[10px] ml-auto h-full items-center">
				<FilterBarDropdown
					label="Sort Direction"
					showAll={false}
					options={[
						{ paramId: "ASC", displayText: "Ascending" },
						{ paramId: "DESC", displayText: "Descending" },
					]}
					defaultValue={get("sortDir") ?? "ASC"}
					onChange={(v) => setPending("sortDir", v)}
				/>
				<FilterBarDropdown
					label="Sort By"
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
					onChange={(v) => setPending("sortBy", v)}
				/>
				<button
					onClick={applyFilters}
					className="bg-accent/80 rounded-full px-[10px] py-[5px] text-primary-dark ml-[20px]"
				>
					<BiRefresh />
				</button>
			</div>
		</div>
	);
};

export default FilterBar;
