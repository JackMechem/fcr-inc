import CarScroll from "./components/scrolls/carScroll";
import TitleText from "./components/text/titleText";
import { getAllCars } from "./lib/CarApi";
import { Car } from "./types/CarTypes";
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

const Home = async () => {
	const carsData: Car[] = await getAllCars();
	console.log(carsData);

	return (
		<>
			<LandingHeader  />
			<LandingHero />
			<MainBodyContainer className="flex flex-col gap-[40px] pb-[500px]">
				<BrandScroll>
					<CarBrandCard
						title="Porsche"
						startingPrice={119}
						logoImage={PorscheLogo.src}
						carImage={PorscheCarImage.src}
					/>
					<CarBrandCard
						title="BMW"
						startingPrice={79}
						logoImage={BmwLogo.src}
						carImage={BmwCarImage.src}
					/>
					<CarBrandCard
						title="Mercedes Benz"
						startingPrice={69}
						logoImage={MercedesLogo.src}
						carImage={MercedesCarImage.src}
					/>
					<CarBrandCard
						title="Audi"
						startingPrice={89}
						logoImage={AudiLogo.src}
						carImage={AudiCarImage.src}
					/>
					<CarBrandCard
						title="Volkswagen"
						startingPrice={69}
						logoImage={VolkswagenLogo.src}
						carImage={VolkswagenCarImage.src}
					/>
				</BrandScroll>

				<div>
					<TitleText className="mt-[20px]">Popular Cars</TitleText>
					{carsData.length > 0 && <CarScroll cars={carsData} />}
				</div>
			</MainBodyContainer>
		</>
	);
};

export default Home;
