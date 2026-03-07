import { Car } from "@/app/types/CarTypes";
import Image from "next/image";
import Link from "next/link";

interface CarCardProps {
	car: Car;
}

const CarCard = async ({ car }: CarCardProps) => {
	return (
		<Link
			href={`car/${car.vin}`}
			className="text-left min-w-[300px] max-w-[300px] border-third rounded-xl cursor-pointer p-[5px] hover:scale-[102%] duration-150 text-accent font-titillium font-bold text-[20pt] italic"
		>
			<Image
				width={300}
				height={300}
				alt={"car image"}
				src={car.imageUrls[0]}
				className="rounded-xl w-full h-[200px] object-cover"
				loading="lazy"
			/>
			<h2 className="text-[16pt]">
				{car.make} {car.model}
			</h2>
			<p className="text-[12pt] capitalize font-[600]">{car.year}</p>
			<h2 className="text-right text-[20pt] mt-[10px] mr-[10px]">
				${car.pricePerDay}/day
			</h2>
		</Link>
	);
};

export default CarCard;
