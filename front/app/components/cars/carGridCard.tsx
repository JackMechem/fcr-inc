import { Car } from "@/app/types/CarTypes";
import Image from "next/image";
import Link from "next/link";
import { BiCar } from "react-icons/bi";
import { GiCarSeat } from "react-icons/gi";
import { PiEngine } from "react-icons/pi";

const CarGridCard = ({ car }: { car: Car }) => (
	<Link
		href={`/car/${car.vin}`}
		className="text-left rounded-xl overflow-hidden cursor-pointer hover:scale-[102%] duration-150 text-foreground bg-primary shadow-md flex flex-col border border-third"
	>
		<Image
			width={400}
			height={250}
			alt={`${car.make} ${car.model}`}
			src={car.images[0]}
			className="w-full h-[180px] object-cover"
			loading="lazy"
		/>
		<div className="px-[16px] py-[14px] flex flex-col gap-[10px] flex-1">
			<div>
				<h2 className="text-[13pt] font-[500] truncate">
					{car.make} {car.model}
				</h2>
				<p className="text-[10pt] text-secondary">{car.modelYear}</p>
			</div>
			<div className="text-foreground-light text-[10pt] flex flex-col gap-[4px]">
				<div className="flex gap-[5px] items-center">
					<BiCar />
					<p className="lowercase first-letter:uppercase">{car.vehicleClass}</p>
				</div>
				<div className="flex gap-[5px] items-center">
					<GiCarSeat />
					<p>{car.seats} seats</p>
				</div>
				<div className="flex gap-[5px] items-center">
					<PiEngine />
					<p className="lowercase first-letter:uppercase">
						{car.engineLayout === "DUAL_MOTOR" || car.engineLayout === "SINGLE_MOTOR"
							? car.engineLayout
							: `${car.engineLayout} ${car.cylinders}`}
					</p>
				</div>
			</div>
			<div className="flex justify-between items-center mt-auto pt-[6px]">
				<h2 className="text-accent text-[15pt] font-[600]">
					${car.pricePerDay}
					<span className="text-[10pt] opacity-60">/day</span>
				</h2>
			</div>
		</div>
	</Link>
);

export default CarGridCard;
