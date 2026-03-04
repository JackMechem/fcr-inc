import LandingHeader from "./components/headers/landingHeader";
import CarScroll from "./components/scrolls/carScroll";
import LandingSearchBar from "./components/searchBars/landingSearchBar";
import { getAllCars } from "./lib/CarApi";

const Home = async () => {
	const carsData = await getAllCars();

	return (
		<div>
			<LandingSearchBar />
			<div className="w-full md:px-[100px] px-[20px] mt-[50px]">
				<h1 className=" text-accent font-titillium font-bold text-[24pt] italic">
					All Cars
				</h1>
				<CarScroll cars={carsData} />
				<p></p>
			</div>
		</div>
	);
};

export default Home;
