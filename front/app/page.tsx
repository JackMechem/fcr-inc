import { Suspense } from "react";
import PaymentSuccessDialog from "./components/dialogs/PaymentSuccessDialog";
import TitleText from "./components/text/titleText";
import { getBrandScrollData, getFeaturedCars } from "./actions";
import { Car } from "./types/CarTypes";
import MainBodyContainer from "./components/containers/mainBodyContainer";
import NavHeader from "./components/headers/navHeader";
import LandingHero from "./components/heros/landingHero";
import CarBrandCard from "./components/cards/carBrandCard";
import BrandScroll from "./components/scrolls/brandScroll";
import BrandScrollSkeleton from "./components/skeletons/BrandScrollSkeleton";
import CarGridCard from "./components/cars/carGridCard";
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
import { BiArrowToRight } from "react-icons/bi";
import PageFooter from "./components/footer/PageFooter";
import styles from "./home.module.css";

// --- Async data components ---

const BrandScrollSection = async () => {
	const { mercedes: mercedesPages, bmw: bmwPages, porsche: porschePages, audi: audiPages, volkswagen: volkswagenPages } = await getBrandScrollData();

	return (
		<BrandScroll>
			<CarBrandCard title="Porsche" startingPrice={porschePages.data[0]?.pricePerDay} logoImage={PorscheLogo.src} carImage={PorscheCarImage.src} />
			<CarBrandCard title="BMW" startingPrice={bmwPages.data[0]?.pricePerDay} logoImage={BmwLogo.src} carImage={BmwCarImage.src} />
			<CarBrandCard title="Mercedes-Benz" startingPrice={mercedesPages.data[0]?.pricePerDay} logoImage={MercedesLogo.src} carImage={MercedesCarImage.src} />
			<CarBrandCard title="Audi" startingPrice={audiPages.data[0]?.pricePerDay} logoImage={AudiLogo.src} carImage={AudiCarImage.src} />
			<CarBrandCard title="Volkswagen" startingPrice={volkswagenPages.data[0]?.pricePerDay} logoImage={VolkswagenLogo.src} carImage={VolkswagenCarImage.src} />
		</BrandScroll>
	);
};

const FeaturedCarsSection = async () => {
	const result = await getFeaturedCars();
	const cars: Car[] = result.data.filter(
		(c) => c.carStatus !== "DISABLED" && c.carStatus !== "ARCHIVED"
	);
	if (cars.length === 0) return null;
	return (
		<div className={styles.featuredGrid}>
			{cars.map((car) => (
				<CarGridCard key={car.vin} car={car} datesReady={true} />
			))}
		</div>
	);
};

const FeaturedCardsSkeleton = () => (
	<div className={styles.featuredGrid}>
		{Array.from({ length: 8 }).map((_, i) => (
			<div key={i} className={styles.cardSkeleton} />
		))}
	</div>
);

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
				<div className={styles.brandSection}>
					<div className={styles.featuredHeader}>
						<div>
							<TitleText>Featured Brands</TitleText>
							<p className={styles.featuredSubtitle}>Browse by manufacturer</p>
						</div>
					</div>
					<Suspense fallback={<BrandScrollSkeleton />}>
						<BrandScrollSection />
					</Suspense>
				</div>

				<div className={styles.featuredSection}>
					<div className={styles.featuredHeader}>
						<div>
							<TitleText>Explore Our Fleet</TitleText>
							<p className={styles.featuredSubtitle}>
								Handpicked vehicles for every occasion
							</p>
						</div>
						<Link href="/browse" className={styles.browseBtn}>
							Browse all
							<BiArrowToRight className={styles.browseBtnIcon} />
						</Link>
					</div>

					<Suspense fallback={<FeaturedCardsSkeleton />}>
						<FeaturedCarsSection />
					</Suspense>

					<div className={styles.ctaRow}>
						<Link href="/browse" className={styles.ctaBtn}>
							View full inventory
						</Link>
					</div>
				</div>
			</MainBodyContainer>
			<PageFooter />
		</>
	);
};

export default Home;
