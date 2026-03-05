/*
 * TODO: Clean up and create components for features and properties
 */

import ImageView from "@/app/components/carpage/imageView";
import TitleText from "@/app/components/text/titleText";
import { getCar } from "@/app/lib/CarApi";
import { Car } from "@/app/types/CarTypes";

const CarPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
	const { slug } = await params;

	const carData: Car = await getCar(slug);

	return (
		<div className="md:mx-[100px] mx-[25px] pb-[100px]">
			<ImageView imgUrls={carData.imageUrls} />
			<div className="mt-[20px]">
				<TitleText>
					{carData.make} {carData.model}
				</TitleText>
				<p className="text-secondary capitalize">
					{carData.fuelType} {carData.engineType}
				</p>
				<div className="flex gap-[10px] mt-[20px]">
					{carData.features.map((feature: string, index: number) => (
						<div
							key={feature + index}
							className="bg-accent px-[15px] py-[5px] text-primary text-[14px] rounded-full opacity-[0.8] font-[500]"
						>
							{feature}
						</div>
					))}
				</div>
				<div className="flex gap-[10px] mt-[10px] w-fit">
					<div className="bg-third px-[10px] py-[5px] rounded-md w-fit text-foreground">
						{carData.mpg} mpg
					</div>
					<div className="bg-third px-[10px] py-[5px] rounded-md w-fit text-foreground">
						{carData.gears} speed {carData.transmission}
					</div>
					<div className="bg-third px-[10px] py-[5px] rounded-md w-fit text-foreground">
						{carData.seats} seats
					</div>
					<div className="bg-third px-[10px] py-[5px] rounded-md w-fit text-foreground">
						{carData.horsepower} hp
					</div>
					<div className="bg-third px-[10px] py-[5px] rounded-md w-fit text-foreground">
						{carData.torqe} ft-lb torqe
					</div>
				</div>
				<div className="mt-[50px] text-foreground">{carData.description}</div>
			</div>
		</div>
	);
};

export default CarPage;
