import { Suspense } from "react";
import { getFilterBarData } from "./actions";
import { CarApiParams } from "../types/CarTypes";
import { CarEnums } from "../types/CarEnums";
import NavHeader from "../components/headers/navHeader";
import FilterButton from "./components/filters/filterButton";
import SortButtons from "./components/filters/sortButtons";
import ActiveFilters from "./components/filters/activeFilters";
import InfiniteCarList from "./components/list/InfiniteCarList";
import LayoutToggle from "./components/filters/layoutToggle";
import BrowseContentWrapper from "./components/list/BrowseContentWrapper";
import BrowseParamsSync from "./components/list/BrowseParamsSync";
import PageFooter from "../components/footer/PageFooter";
import styles from "./components/list/browseContent.module.css";

type Params = { [key: string]: string | string[] | undefined };

const str = (val: string | string[] | undefined): string | undefined =>
	Array.isArray(val) ? val[0] : val;
const num = (val: string | string[] | undefined): number | undefined =>
	str(val) ? Number(str(val)) : undefined;

const FilterButtonWithEnums = async () => {
	const { enums, makes } = await getFilterBarData();
	return <FilterButton enums={enums as CarEnums} makes={makes as string[]} />;
};

const FilterButtonSkeleton = () => (
	<div className={styles.filterBtnSkeleton} />
);

// --- Page ---

const BrowsePage = async ({
	searchParams,
}: {
	searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
	const p = (await searchParams) ?? {};
	const layout = p.layout === "grid" ? "grid" : "list";

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
		sortBy: str(p.sortBy) ?? "popularity",
		sortDir: (str(p.sortDir) ?? ((str(p.sortBy) ?? "popularity") === "popularity" ? "desc" : undefined)) as "asc" | "desc" | undefined,
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
		availabilityFilter: str(p.availabilityFilter),
	};

	return (
		<div className={styles.page}>
			<Suspense>
				<BrowseParamsSync />
			</Suspense>
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
			<div className={styles.toolbar}>
				<div className={styles.toolbarLeft}>
					<SortButtons />
				</div>
				<div className={styles.layoutToggleWrap}>
					<Suspense>
						<LayoutToggle />
					</Suspense>
				</div>
				<div className={styles.toolbarFiltersRow}>
					<ActiveFilters className={styles.toolbarActiveFilters} />
				</div>
			</div>
			<BrowseContentWrapper>
				<InfiniteCarList
					filterParams={filterParams}
					layout={layout}
					fromDate={str(p.fromDate)}
					untilDate={str(p.untilDate)}
				/>
			</BrowseContentWrapper>
			<PageFooter />
		</div>
	);
};

export default BrowsePage;
