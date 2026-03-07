import { Car } from "@/app/types/CarTypes";
import Markdown from "react-markdown";
import CarFeature from "./carFeature";
import CarFeaturesContainer from "./CarFeaturesContainer";
import CarPropertiesContainer from "./carPropertiesContainer";
import CarProperty from "./carProperty";
import ImageView from "./imageView";
import TitleText from "@/app/components/text/titleText";
import { PropsWithChildren } from "react";

interface LeftColumnProps extends PropsWithChildren {
	carData: Car;
}

const LeftColumn = ({ children, carData }: LeftColumnProps) => {
	return (
		<div className="w-full">
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
		</div>
	);
};

export default LeftColumn;
