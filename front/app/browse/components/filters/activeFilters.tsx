"use client";
import { useFilterParams } from "./useFilterParams";
import { CarApiParams } from "@/app/types/CarTypes";
import styles from "./browseBar.module.css";

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

const SKIP = new Set([
	"page",
	"pageSize",
	"sortBy",
	"sortDir",
	"select",
	"layout",
	"search",
	"fromDate",
	"untilDate",
	"availabilityFilter",
]);

const formatValue = (value: string | string[] | number | undefined): string => {
	if (Array.isArray(value)) {
		if (value.length === 1) return value[0].toLowerCase().replace(/_/g, " ");
		return `${value.length} selected`;
	}
	const str = value?.toString() ?? "";
	// comma-separated multi values stored as string
	const parts = str.split(",");
	if (parts.length === 1) return str.toLowerCase().replace(/_/g, " ");
	return `${parts.length} selected`;
};

const ActiveFilters = ({ className }: { className?: string }) => {
	const { params, remove } = useFilterParams();

	const entries = Object.entries(params).filter(([key]) => !SKIP.has(key));

	if (entries.length === 0) return null;

	return (
		<div className={`${styles.activeFilters} ${className ?? ""}`}>
			{entries.map(([key, value]) => (
				<button
					key={key}
					onClick={() => remove(key as keyof CarApiParams)}
					className={styles.activeFilterChip}
				>
					<span className={styles.activeFilterKey}>{LABELS[key] ?? key.toLowerCase()}:</span>
					<span>{formatValue(value as string | string[] | number | undefined)}</span>
					<span className={styles.activeFilterX}>✕</span>
				</button>
			))}
		</div>
	);
};

export default ActiveFilters;
