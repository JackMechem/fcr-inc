import { getCar } from "@/app/lib/CarApi";
import { Car } from "@/app/types/CarTypes";
import LeftColumn from "./components/leftColumn";
import RightColumn from "./components/rightColumn";
import ImageView from "./components/imageView";

const CarPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
	const { slug } = await params;

	const carData: Car = await getCar(slug);

	return (
		<>
			<ImageView imgUrls={carData.imageUrls} />
			<div className="flex md:flex-row flex-col gap-[20px]">
				<LeftColumn carData={carData}></LeftColumn>
				<RightColumn carData={carData}></RightColumn>
			</div>
		</>
	);
};

export default CarPage;
