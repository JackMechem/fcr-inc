import CarScroll from "./components/scrolls/carScroll";
import TitleText from "./components/text/titleText";
import { getAllCars, getFilteredCars } from "./lib/CarApi";
import { Car, CarPages } from "./types/CarTypes";
import MainBodyContainer from "./components/containers/mainBodyContainer";
import LandingPageFilterButtons from "./components/buttons/landingPageFilterButtons";
import LandingHeader from "./components/headers/landingHeader";
import LandingHero from "./components/heros/landingHero";
import CarBrandCard from "./components/cards/carBrandCard";

import BrandScroll from "./components/scrolls/brandScroll";
import BmwLogo from "./media/carBrandLogos/bmw.svg";
import BmwCarImage from "./media/transparentCarImages/bmw.png";
import MercedesLogo from "./media/carBrandLogos/mercedes.svg";
import MercedesCarImage from "./media/transparentCarImages/mercedesAmg.png";
import PorscheLogo from "./media/carBrandLogos/porsche.svg";
import PorscheCarImage from "./media/transparentCarImages/porsche.png";
import AudiLogo from "./media/carBrandLogos/audi.svg";
import AudiCarImage from "./media/transparentCarImages/audi.png";
import VolkswagenLogo from "./media/carBrandLogos/volkswagen.svg";
import VolkswagenCarImage from "./media/transparentCarImages/volkswagen.png";
import Link from "next/link";

const Home = async () => {
	const carPagesLuxuryData: CarPages = await getFilteredCars({
		vehicleClass: "LUXURY",
	});
	const carsDataLuxury: Car[] = carPagesLuxuryData.data;

	const carPagesDataManual: CarPages = await getFilteredCars({
		transmission: "MANUAL",
	});
	const carsDataManual: Car[] = carPagesDataManual.data;

	const carPagesDataCheap: CarPages = await getFilteredCars({
		minPricePerDay: 0,
		maxPricePerDay: 100,
	});
	const carsDataCheap: Car[] = carPagesDataCheap.data;

	const mercedesLowestPricePages: CarPages = await getFilteredCars({
		pageSize: 1,
		page: 1,
		sortBy: "pricePerDay",
        make: "Mercedes-Benz",
		sortDir: "asc",
        select: "pricePerDay"
	});
    const mercedesLowestPrice: number = mercedesLowestPricePages.data[0].pricePerDay;

	const bmwLowestPricePages: CarPages = await getFilteredCars({
		pageSize: 1,
		page: 1,
		sortBy: "pricePerDay",
        make: "Mercedes-Benz",
		sortDir: "asc",
        select: "pricePerDay"
	});
    const bmwLowestPrice: number = bmwLowestPricePages.data[0].pricePerDay;

	const porscheLowestPricePages: CarPages = await getFilteredCars({
		pageSize: 1,
		page: 1,
		sortBy: "pricePerDay",
        make: "Porsche",
		sortDir: "asc",
        select: "pricePerDay"
	});
    const porscheLowestPrice: number = porscheLowestPricePages.data[0].pricePerDay;

	const audiLowestPricePages: CarPages = await getFilteredCars({
		pageSize: 1,
		page: 1,
		sortBy: "pricePerDay",
        make: "Audi",
		sortDir: "asc",
        select: "pricePerDay"
	});
    const audiLowestPrice: number = audiLowestPricePages.data[0].pricePerDay;

	const volkswagenLowestPricePages: CarPages = await getFilteredCars({
		pageSize: 1,
		page: 1,
		sortBy: "pricePerDay",
        make: "Volkswagen",
		sortDir: "asc",
        select: "pricePerDay"
	});
    const volkswagenLowestPrice: number = volkswagenLowestPricePages.data[0].pricePerDay;


	return (
		<>
			<LandingHeader />
			<LandingHero />
			<MainBodyContainer className="flex flex-col gap-[40px]">
				<BrandScroll>
					<CarBrandCard
						title="Porsche"
						startingPrice={porscheLowestPrice}
						logoImage={PorscheLogo.src}
						carImage={PorscheCarImage.src}
					/>
					<CarBrandCard
						title="BMW"
						startingPrice={bmwLowestPrice}
						logoImage={BmwLogo.src}
						carImage={BmwCarImage.src}
					/>
					<CarBrandCard
						title="Mercedes-Benz"
						startingPrice={mercedesLowestPrice}
						logoImage={MercedesLogo.src}
						carImage={MercedesCarImage.src}
					/>
					<CarBrandCard
						title="Audi"
						startingPrice={audiLowestPrice}
						logoImage={AudiLogo.src}
						carImage={AudiCarImage.src}
					/>
					<CarBrandCard
						title="Volkswagen"
						startingPrice={volkswagenLowestPrice}
						logoImage={VolkswagenLogo.src}
						carImage={VolkswagenCarImage.src}
					/>
				</BrandScroll>

				<div>
					<Link
						href={"/browse?vehicleClass=LUXURY"}
						className="flex justify-between items-center mt-[40px]"
					>
						<TitleText>Luxury Cars</TitleText>
						<p className="text-accent text-[12pt] font-[500]">
							See more {"->"}
						</p>
					</Link>
					{carsDataLuxury.length > 0 && <CarScroll cars={carsDataLuxury} />}
				</div>
				<div>
					<Link
						href={"/browse?transmission=MANUAL"}
						className="flex justify-between items-center mt-[20px]"
					>
						<TitleText>Manual Cars</TitleText>
						<p className="text-accent text-[12pt] font-[500]">
							See more {"->"}
						</p>
					</Link>
					{carsDataManual.length > 0 && <CarScroll cars={carsDataManual} />}
				</div>
				<div>
					<Link
						href={"/browse?minPricePerDay=0&maxPricePerDay=100"}
						className="flex justify-between items-center mt-[20px]"
					>
						<TitleText>Cars Under $100/day</TitleText>
						<p className="text-accent text-[12pt] font-[500]">
							See more {"->"}
						</p>
					</Link>
					{carsDataCheap.length > 0 && <CarScroll cars={carsDataCheap} />}
				</div>
			</MainBodyContainer>
		</>
	);
};

export default Home;
