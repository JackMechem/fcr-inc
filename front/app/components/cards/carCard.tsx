import { Car } from "@/app/types/CarTypes";
import Image from "next/image";
import Link from "next/link";
import { BiHeart } from "react-icons/bi";

interface CarCardProps {
	car: Car;
}

const CarCard = ({ car }: CarCardProps) => {
	return (
		<Link
			href={`car/${car.vin}`}
			className="text-left min-w-[250px] md:w-[250px] w-full rounded-lg overflow-hidden cursor-pointer hover:scale-[103%] duration-150 text-foreground font-inter text-[20pt] bg-primary shadow-md"
		>
			<Image
				width={300}
				height={300}
				alt={"car image"}
				src={car.images[0]}
				className="w-full h-[200px] object-cover"
				loading="lazy"
			/>
			<div className="px-[20px] py-[15px] flex flex-col w-full gap-[10px]">
				<div className="flex items-center justify-between w-full overflow-hidden">
					<div className="h-auto flex-grow min-w-0">
						<h2 className="text-[14pt] font-[500]  truncate h-fit w-full overflow-x-hidden text-ellipsis">
							{car.make} {car.model}
						</h2>
						<p className="text-[11pt] mt-[-3px] lowercase font-[400] text-secondary">
							{car.modelYear}
						</p>
					</div>
                    <BiHeart className="w-[25px] min-w-[25px] max-w-[25px] justify-self-end" />
				</div>
				<div className="flex justify-between items-center">
					<h2 className="text-right text-[14pt] text-accent font-[600]">
						${car.pricePerDay}
						<span className="text-[11pt] opacity-[0.6]">/day</span>
					</h2>
					<div className="bg-accent px-[20px] py-[5px] h-fit text-[11pt] rounded-full text-primary font-[500]">
						Rent now
					</div>
				</div>
			</div>
		</Link>
	);
};

export default CarCard;
