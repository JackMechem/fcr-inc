"use client";
import { useFilterParams } from "./useFilterParams";
import { CarApiParams } from "@/app/types/CarTypes";

const LABELS: Record<string, string> = {
	make: "Make",
	model: "Model",
	modelYear: "Year",
	minModelYear: "Min Year",
	maxModelYear: "Max Year",
	transmission: "Transmission",
	drivetrain: "Drivetrain",
	engineLayout: "Engine",
	fuel: "Fuel",
	bodyType: "Body",
	roofType: "Roof",
	vehicleClass: "Class",
	minHorsepower: "Min HP",
	maxHorsepower: "Max HP",
	minTorque: "Min Torque",
	maxTorque: "Max Torque",
	minSeats: "Min Seats",
	maxSeats: "Max Seats",
	minMpg: "Min MPG",
	maxMpg: "Max MPG",
	minCylinders: "Min Cyl",
	maxCylinders: "Max Cyl",
	minGears: "Min Gears",
	maxGears: "Max Gears",
	minPricePerDay: "Min Price",
	maxPricePerDay: "Max Price",
};

const SKIP = new Set(["page", "pageSize", "sortBy", "sortDir", "select"]);

const ActiveFilters = ({ className }: { className: string }) => {
	const { params, remove } = useFilterParams();

	const entries = Object.entries(params).filter(([key]) => !SKIP.has(key));

	if (entries.length === 0) return null;

	return (
		<div
			className={"md:flex hidden flex-wrap gap-[6px] items-center " + className}
		>
			{entries.map(([key, value]) => (
				<button
					key={key}
					onClick={() => remove(key as keyof CarApiParams)}
					className="flex items-center gap-[4px] bg-accent/80 text-primary text-[9pt] rounded-full px-[10px] py-[4px] hover:bg-accent/100 transition-colors font-[500]"
				>
					<span className="text-primary">{LABELS[key] ?? key}:</span>
					<span>{value}</span>
					<span className="text-primary ml-[2px]">✕</span>
				</button>
			))}
		</div>
	);
};

export default ActiveFilters;
