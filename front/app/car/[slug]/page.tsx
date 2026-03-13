import { getCar } from "@/app/lib/CarApi";
import { Car } from "@/app/types/CarTypes";
import LeftColumn from "./components/leftColumn";
import RightColumn from "./components/rightColumn";
import ImageView from "./components/imageView";
import MainBodyContainer from "@/app/components/containers/mainBodyContainer";
import LandingHeader from "@/app/components/headers/landingHeader";

const CarPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
	const { slug } = await params;

	const carData: Car = await getCar(slug);
	console.log(carData);

	return (
		<>
			<LandingHeader />
			<MainBodyContainer>
				<ImageView images={carData.images} />
				<div className="flex md:flex-row flex-col gap-[20px]">
					<LeftColumn carData={carData}></LeftColumn>
					<RightColumn carData={carData}></RightColumn>
				</div>
			</MainBodyContainer>
		</>
	);
};

export default CarPage;
