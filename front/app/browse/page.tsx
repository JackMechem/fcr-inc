import Image from "next/image";
import MainBodyContainer from "../components/containers/mainBodyContainer";
import { getFilteredCars } from "../lib/CarApi";
import { Car, CarPages } from "../types/CarTypes";
import FilterBar from "./components/filterBar";
import PageButtons from "./components/pageButtons";
import Link from "next/link";
import BrowseHeader from "../components/headers/browseHeader";
import CarCard from "./components/carCard";

const BrowsePage = async ({
	searchParams,
}: {
	searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
	const str = (val: string | string[] | undefined): string | undefined =>
		Array.isArray(val) ? val[0] : val;
	const num = (val: string | string[] | undefined): number | undefined =>
		str(val) ? Number(str(val)) : undefined;

	const p = (await searchParams) ?? {};

	const carsPages: CarPages = await getFilteredCars({
		page: num(p.page),
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
	});

	return (
		<div className="w-full h-full bg-primary-dark/50">
			<BrowseHeader white={false} />
			<FilterBar />
			<div className="2xl:px-[200px] lg:px-[50px] pt-[15px] pb-[50px] w-full h-fill m-0">
				<div className="grid md:grid-cols-2 grid-cols-1 w-full gap-[15px] h-auto text-foreground">
					{carsPages.cars.map((car: Car) => (
						<CarCard key={car.vin} car={car} />
					))}
				</div>
				<PageButtons carsPages={carsPages} />
			</div>
		</div>
	);
};

export default BrowsePage;
