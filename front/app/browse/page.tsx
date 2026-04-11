import { Suspense } from "react";
import { getFilteredCars } from "../lib/CarApi";
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

type Params = { [key: string]: string | string[] | undefined };

const str = (val: string | string[] | undefined): string | undefined =>
	Array.isArray(val) ? val[0] : val;
const num = (val: string | string[] | undefined): number | undefined =>
	str(val) ? Number(str(val)) : undefined;

// --- Skeletons ---

const CarCardSkeleton = () => (
	<div className="flex md:flex-row flex-col md:h-[300px] w-full gap-[10px]">
		<div className="md:w-[40%] w-full md:h-auto h-[200px] rounded-xl bg-third animate-pulse" />
		<div className="md:w-[60%] w-full px-[20px] py-[15px] flex flex-col justify-between gap-[10px] shadow-[0px_1px_8px_-3px] shadow-accent/30 bg-accent/3 rounded-xl">
			<div className="flex flex-col gap-[8px]">
				<div className="flex justify-between">
					<div className="h-[24px] w-[40%] bg-third rounded animate-pulse" />
					<div className="h-[20px] w-[25%] bg-third rounded animate-pulse" />
				</div>
				<div className="h-[16px] w-[20%] bg-third rounded animate-pulse" />
			</div>
			<div className="flex justify-between items-end">
				<div className="flex flex-col gap-[8px]">
					<div className="h-[14px] w-[80px] bg-third rounded animate-pulse" />
					<div className="h-[14px] w-[50px] bg-third rounded animate-pulse" />
					<div className="h-[14px] w-[70px] bg-third rounded animate-pulse" />
				</div>
				<div className="flex flex-col items-end gap-[6px]">
					<div className="h-[32px] w-[110px] bg-third rounded animate-pulse" />
					<div className="h-[12px] w-[70px] bg-third rounded animate-pulse" />
				</div>
			</div>
		</div>
	</div>
);

const CarListSkeleton = () => (
	<div className="grid grid-cols-1 w-full gap-[20px] px-[10px]">
		{Array.from({ length: 8 }).map((_, i) => (
			<CarCardSkeleton key={i} />
		))}
	</div>
);

const CarGridCardSkeleton = () => (
	<div className="rounded-xl overflow-hidden bg-primary shadow-md flex flex-col">
		<div className="w-full h-[180px] bg-third animate-pulse" />
		<div className="px-[16px] py-[14px] flex flex-col gap-[10px]">
			<div className="flex flex-col gap-[6px]">
				<div className="h-[18px] w-[70%] bg-third rounded animate-pulse" />
				<div className="h-[14px] w-[30%] bg-third rounded animate-pulse" />
			</div>
			<div className="flex flex-col gap-[6px]">
				<div className="h-[13px] w-[50%] bg-third rounded animate-pulse" />
				<div className="h-[13px] w-[40%] bg-third rounded animate-pulse" />
				<div className="h-[13px] w-[55%] bg-third rounded animate-pulse" />
			</div>
			<div className="flex justify-between items-center pt-[6px]">
				<div className="h-[22px] w-[70px] bg-third rounded animate-pulse" />
				<div className="h-[28px] w-[80px] bg-third rounded-full animate-pulse" />
			</div>
		</div>
	</div>
);

const CarGridSkeleton = () => (
	<div className="grid 2xl:grid-cols-4 xl:grid-cols-3 sm:grid-cols-2 grid-cols-1 w-full gap-[16px] px-[10px]">
		{Array.from({ length: 8 }).map((_, i) => (
			<CarGridCardSkeleton key={i} />
		))}
	</div>
);

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
	const enums: CarEnums = await getAllEnums();
	return <FilterButton enums={enums} />;
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
			<div className="2xl:px-[200px] lg:px-[50px] pt-[15px] pb-[50px] w-full h-fill bg-primary m-0">
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
			</div>
		</div>
	);
};

export default BrowsePage;
