import { Suspense } from "react";
import { getAllMakes, getFilteredCars } from "../lib/CarApi";
import { getAllEnums } from "../lib/EnumApi";
import { CarPages } from "../types/CarTypes";
import { CarApiParams } from "../types/CarTypes";
import { CarEnums } from "../types/CarEnums";
import NavHeader from "../components/headers/navHeader";
import FilterButton from "./components/filterButton";
import SortButtons from "./components/sortButtons";
import ActiveFilters from "./components/activeFilters";
import InfiniteCarList from "./components/InfiniteCarList";
import LayoutToggle from "./components/layoutToggle";
import CarListSkeleton from "../components/skeletons/CarListSkeleton";
import CarGridSkeleton from "../components/skeletons/CarGridSkeleton";
import BrowseContentWrapper from "./components/BrowseContentWrapper";

type Params = { [key: string]: string | string[] | undefined };

const str = (val: string | string[] | undefined): string | undefined =>
	Array.isArray(val) ? val[0] : val;
const num = (val: string | string[] | undefined): number | undefined =>
	str(val) ? Number(str(val)) : undefined;

// --- Async data components ---

const CarResults = async ({
	p,
	layout,
}: {
	p: Params;
	layout: "list" | "grid";
}) => {
	const filterParams: CarApiParams = {
		page: 1,
		pageSize: num(p.pageSize),
		modelYear: num(p.modelYear),
		minModelYear: num(p.minModelYear),
		maxModelYear: num(p.maxModelYear),
		minHorsepower: num(p.minHorsepower),
		maxHorsepower: num(p.maxHorsepower),
		minTorque: num(p.minTorque),
		maxTorque: num(p.maxTorque),
		minSeats: num(p.minSeats),
		maxSeats: num(p.maxSeats),
		minMpg: num(p.minMpg),
		maxMpg: num(p.maxMpg),
		minCylinders: num(p.minCylinders),
		maxCylinders: num(p.maxCylinders),
		minGears: num(p.minGears),
		maxGears: num(p.maxGears),
		minPricePerDay: num(p.minPricePerDay),
		maxPricePerDay: num(p.maxPricePerDay),
		select: str(p.select),
		sortBy: str(p.sortBy),
		sortDir: str(p.sortDir) as "asc" | "desc" | undefined,
		make: str(p.make),
		model: str(p.model),
		transmission: str(p.transmission),
		drivetrain: str(p.drivetrain),
		engineLayout: str(p.engineLayout),
		fuel: str(p.fuel),
		bodyType: str(p.bodyType),
		roofType: str(p.roofType),
		vehicleClass: str(p.vehicleClass),
		search: str(p.search),
	};

	const carsPages: CarPages = await getFilteredCars(filterParams);

	return (
		<InfiniteCarList
			initialCars={carsPages.data}
			totalPages={carsPages.totalPages}
			filterParams={filterParams}
			layout={layout}
		/>
	);
};

const FilterButtonWithEnums = async () => {
	const [enums, makes]: [CarEnums, string[]] = await Promise.all([getAllEnums(), getAllMakes()]);
	return <FilterButton enums={enums} makes={makes} />;
};

const FilterButtonSkeleton = () => (
	<div className="w-[48px] h-[36px] rounded-2xl bg-third animate-pulse" />
);

// --- Page ---

const BrowsePage = async ({
	searchParams,
}: {
	searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
	const p = (await searchParams) ?? {};
	const layout = p.layout === "grid" ? "grid" : "list";
	const paramsKey = JSON.stringify(p);

	return (
		<div className="w-full h-full bg-primary">
			<NavHeader
				white={false}
				filterControls={
					<Suspense fallback={<FilterButtonSkeleton />}>
						<FilterButtonWithEnums />
					</Suspense>
				}
				mobileFilterButton={
					<Suspense fallback={<FilterButtonSkeleton />}>
						<FilterButtonWithEnums />
					</Suspense>
				}
				activeFilters={<ActiveFilters className="self-center" />}
			/>
			<BrowseContentWrapper>
				<ActiveFilters className="self-center mt-6 ml-6" />
				<div className="mt-2 mb-4 w-full px-4 flex flex-row gap-4 justify-between items-center">
					<div className="flex items-center justify-between gap-2">
						<SortButtons />
					</div>
					<div className="sm:block hidden">
						<Suspense>
							<LayoutToggle />
						</Suspense>
					</div>
				</div>
				<Suspense
					key={paramsKey}
					fallback={
						layout === "grid" ? <CarGridSkeleton /> : <CarListSkeleton />
					}
				>
					<CarResults p={p} layout={layout} />
				</Suspense>
			</BrowseContentWrapper>
		</div>
	);
};

export default BrowsePage;
