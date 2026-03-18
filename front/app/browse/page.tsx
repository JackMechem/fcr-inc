import Image from "next/image";
import MainBodyContainer from "../components/containers/mainBodyContainer";
import LandingHeader from "../components/headers/landingHeader";
import { getFilteredCars } from "../lib/CarApi";
import { Car, CarPages } from "../types/CarTypes";
import FilterBar from "./components/filterBar";
import PageButtons from "./components/pageButtons";
import TitleText from "../components/text/titleText";
import Link from "next/link";

interface BrowseSearchParams {
	page?: string;
	pageSize?: string;
	select?: string;
	sortBy?: string;
	sortDir?: string;
	make?: string;
	model?: string;
	modelYear?: string;
	transmission?: string;
	drivetrain?: string;
	engineLayout?: string;
	fuel?: string;
	bodyType?: string;
	roofType?: string;
	vehicleClass?: string;
}

const BrowsePage = async ({
	searchParams,
}: {
	searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
	const str = (val: string | string[] | undefined): string | undefined =>
		Array.isArray(val) ? val[0] : val;

	const p = (await searchParams) ?? {};

	const carsPages: CarPages = await getFilteredCars({
		page: str(p.page) ? Number(str(p.page)) : undefined,
		pageSize: str(p.pageSize) ? Number(str(p.pageSize)) : undefined,
		modelYear: str(p.modelYear) ? Number(str(p.modelYear)) : undefined,
		minModelYear: str(p.minModelYear) ? Number(str(p.minModelYear)) : undefined,
		maxModelYear: str(p.maxModelYear) ? Number(str(p.maxModelYear)) : undefined,
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
		<>
			<LandingHeader white={false} />
			<FilterBar />
			<MainBodyContainer>
				<div className="grid grid-cols-2 w-full gap-[10px] mt-[10px] text-foreground">
					{carsPages.cars.map((car: Car) => (
						<Link
                            href={"/car/" + car.vin}
							key={car.vin}
							className="bg-primary rounded-lg border border-third shadow-sm shadow-third/50 overflow-clip flex h-[200px]"
						>
							<Image
								src={car.images[0]}
								alt={car.make}
								height={500}
								width={500}
								className="object-cover w-[40%]"
							/>
							<div className="w-[60%] px-[25px] py-[15px] flex">
								<div>
									<h1 className="text-[16pt] font-[500]">
										{car.make} {car.model}
									</h1>
									<p className="text-foreground-light text-[12pt] leading-[100%]">
										{car.modelYear}{" "}
									</p>
								</div>
								<div className="justify-self-end ml-auto flex flex-col justify-end items-end">
									<h1 className="text-accent text-[20pt]">
										${car.pricePerDay}
										<span className="text-accent/60 text-[12pt]">/day</span>
									</h1>
									<p className="text-foreground-light text-[10pt] leading-[100%]">
                                        Before taxes
									</p>
								</div>
							</div>
						</Link>
					))}
				</div>
				<PageButtons carsPages={carsPages} />
			</MainBodyContainer>
		</>
	);
};

export default BrowsePage;
