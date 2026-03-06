import CarScroll from "./components/scrolls/carScroll";
import LandingSearchBar from "./components/searchBars/landingSearchBar";
import TitleText from "./components/text/titleText";
import { getAllCars } from "./lib/CarApi";
import { Car } from "./types/CarTypes";

const Home = async () => {
	const carsData: Car[] = await getAllCars();

	const manualCarsData: Car[] = carsData.filter((car: Car) => {
		return car.transmission === "manual";
	});

	const automaticCarsData: Car[] = carsData.filter((car: Car) => {
		return car.transmission === "automatic";
	});

	return (
		<>
			<LandingSearchBar />
			<TitleText className="mt-[80px]">Manual Transmission</TitleText>
			{manualCarsData.length > 0 && <CarScroll cars={manualCarsData} />}
			<TitleText className="mt-[80px]">Automatic Transmission</TitleText>
			{manualCarsData.length > 0 && <CarScroll cars={automaticCarsData} />}
		</>
	);
};

export default Home;
