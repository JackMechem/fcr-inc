import { Suspense } from "react";
import PaymentSuccessDialog from "./components/dialogs/PaymentSuccessDialog";
import CarScroll from "./components/scrolls/carScroll";
import TitleText from "./components/text/titleText";
import { getFilteredCars } from "./lib/CarApi";
import { Car, CarPages } from "./types/CarTypes";
import MainBodyContainer from "./components/containers/mainBodyContainer";
import NavHeader from "./components/headers/navHeader";
import LandingHero from "./components/heros/landingHero";
import CarBrandCard from "./components/cards/carBrandCard";
import BrandScroll from "./components/scrolls/brandScroll";
import CarScrollSkeleton from "./components/skeletons/CarScrollSkeleton";
import BrandScrollSkeleton from "./components/skeletons/BrandScrollSkeleton";
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
import styles from "./home.module.css";

// --- Async data components ---

const BrandScrollSection = async () => {
	const [
		mercedesPages,
		bmwPages,
		porschePages,
		audiPages,
		volkswagenPages,
	] = await Promise.all([
		getFilteredCars({ pageSize: 1, page: 1, sortBy: "pricePerDay", make: "Mercedes-Benz", sortDir: "asc", select: "pricePerDay" }),
		getFilteredCars({ pageSize: 1, page: 1, sortBy: "pricePerDay", make: "BMW", sortDir: "asc", select: "pricePerDay" }),
		getFilteredCars({ pageSize: 1, page: 1, sortBy: "pricePerDay", make: "Porsche", sortDir: "asc", select: "pricePerDay" }),
		getFilteredCars({ pageSize: 1, page: 1, sortBy: "pricePerDay", make: "Audi", sortDir: "asc", select: "pricePerDay" }),
		getFilteredCars({ pageSize: 1, page: 1, sortBy: "pricePerDay", make: "Volkswagen", sortDir: "asc", select: "pricePerDay" }),
	]);

	return (
		<BrandScroll>
			<CarBrandCard title="Porsche" startingPrice={porschePages.data[0].pricePerDay} logoImage={PorscheLogo.src} carImage={PorscheCarImage.src} />
			<CarBrandCard title="BMW" startingPrice={bmwPages.data[0].pricePerDay} logoImage={BmwLogo.src} carImage={BmwCarImage.src} />
			<CarBrandCard title="Mercedes-Benz" startingPrice={mercedesPages.data[0].pricePerDay} logoImage={MercedesLogo.src} carImage={MercedesCarImage.src} />
			<CarBrandCard title="Audi" startingPrice={audiPages.data[0].pricePerDay} logoImage={AudiLogo.src} carImage={AudiCarImage.src} />
			<CarBrandCard title="Volkswagen" startingPrice={volkswagenPages.data[0].pricePerDay} logoImage={VolkswagenLogo.src} carImage={VolkswagenCarImage.src} />
		</BrandScroll>
	);
};

const CheapCarsSection = async () => {
	const carPagesDataCheap: CarPages = await getFilteredCars({
		minPricePerDay: 0,
		maxPricePerDay: 100,
	});
	const carsDataCheap: Car[] = carPagesDataCheap.data;

	if (carsDataCheap.length === 0) return null;
	return <CarScroll cars={carsDataCheap} />;
};

// --- Page ---

const Home = () => {
	return (
		<>
			<Suspense>
				<PaymentSuccessDialog />
			</Suspense>
			<NavHeader />
			<LandingHero />
			<MainBodyContainer className={styles.mainContent}>
				<Suspense fallback={<BrandScrollSkeleton />}>
					<BrandScrollSection />
				</Suspense>

				<div>
					<Link
						href="/browse?minPricePerDay=0&maxPricePerDay=100"
						className={styles.sectionHeader}
					>
						<TitleText>Cars Under $100/day</TitleText>
						<p className={styles.seeMore}>See more {"->"}</p>
					</Link>
					<Suspense fallback={<CarScrollSkeleton />}>
						<CheapCarsSection />
					</Suspense>
				</div>
			</MainBodyContainer>
		</>
	);
};

export default Home;
