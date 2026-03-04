import ImageView from "@/app/components/carpage/imageView";
import LandingHeader from "@/app/components/headers/landingHeader";
import { getCar } from "@/app/lib/CarApi";
import { Car } from "@/app/types/CarTypes";
import Image from "next/image";

const CarPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
	const { slug } = await params;

	const carData: Car = await getCar(slug);

	return (
		<div className="mx-[100px]">
			<ImageView imgUrls={carData.imageUrls} />
			<h2>
				{carData.make} {carData.model} {carData.vin}
			</h2>
		</div>
	);
};

export default CarPage;
