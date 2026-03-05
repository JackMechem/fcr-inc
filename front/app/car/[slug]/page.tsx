import Markdown from "react-markdown";
import CarFeature from "./components/carFeature";
import CarFeaturesContainer from "./components/CarFeaturesContainer";
import CarPropertiesContainer from "./components/carPropertiesContainer";
import CarProperty from "./components/carProperty";
import ImageView from "./components/imageView";
import MainBodyContainer from "@/app/components/containers/mainBodyContainer";
import TitleText from "@/app/components/text/titleText";
import { getCar } from "@/app/lib/CarApi";
import { Car } from "@/app/types/CarTypes";

const CarPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
	const { slug } = await params;

	const carData: Car = await getCar(slug);

	return (
		<MainBodyContainer>
			<ImageView imgUrls={carData.imageUrls} />
			<div className="mt-[20px]">
				<TitleText>
					{carData.year} {carData.make} {carData.model}
				</TitleText>
				<p className="text-secondary capitalize text-[12pt]">
					{carData.fuelType} {carData.engineType}
				</p>
				<CarFeaturesContainer>
					{carData.features.map((feature: string, index: number) => (
						<CarFeature key={feature + index}>{feature}</CarFeature>
					))}
				</CarFeaturesContainer>
				<CarPropertiesContainer>
					<CarProperty>{carData.mpg} mpg</CarProperty>
					<CarProperty>
						{carData.gears} speed {carData.transmission}
					</CarProperty>
					<CarProperty>{carData.seats} seats</CarProperty>
					<CarProperty>{carData.horsepower} hp</CarProperty>
					<CarProperty>{carData.torqe} ft-lb torqe</CarProperty>
				</CarPropertiesContainer>
				<div className="mt-[50px] text-foreground">
					<Markdown>{carData.description}</Markdown>
				</div>
			</div>
		</MainBodyContainer>
	);
};

export default CarPage;
