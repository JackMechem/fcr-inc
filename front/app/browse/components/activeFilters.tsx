"use client";
import { usePathname, useSearchParams, useRouter } from "next/navigation";

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
	minHorsepower?: string;
	maxHorsepower?: string;
	minTorque?: string;
	maxTorque?: string;
	minSeats?: string;
	maxSeats?: string;
	minMpg?: string;
	maxMpg?: string;
	minCylinders?: string;
	maxCylinders?: string;
	minGears?: string;
	maxGears?: string;
	minPricePerDay?: string;
	maxPricePerDay?: string;
}

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
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const entries = Array.from(searchParams.entries()).filter(
		([key]) => !SKIP.has(key),
	);

	if (entries.length === 0) return null;

	const removeParam = (key: string) => {
		const params = new URLSearchParams(searchParams.toString());
		params.delete(key);
		router.push(`${pathname}?${params.toString()}`);
	};

	return (
		<div className={"md:flex hidden flex-wrap gap-[6px] items-center " + className}>
			{entries.map(([key, value]) => (
				<button
					key={key}
					onClick={() => removeParam(key)}
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
