import { getCar } from "@/app/lib/CarApi";
import { Car } from "@/app/types/CarTypes";
import LeftColumn from "./components/leftColumn";
import RightColumn from "./components/rightColumn";
import ImageView from "./components/imageView";
import MainBodyContainer from "@/app/components/containers/mainBodyContainer";
import NavHeader from "@/app/components/headers/navHeader";

const CarPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
	const { slug } = await params;

	const carData: Car = await getCar(slug);
	console.log(carData);

	return (
		<div>
			<NavHeader white={false} />
			<MainBodyContainer className="mt-[20px]">
				<ImageView images={carData.images} />
				<div className="flex md:flex-row flex-col gap-[20px]">
					<LeftColumn carData={carData}></LeftColumn>
					<RightColumn carData={carData}></RightColumn>
				</div>
			</MainBodyContainer>
		</div>
	);
};

export default CarPage;
