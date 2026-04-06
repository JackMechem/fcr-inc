import { Car } from "@/app/types/CarTypes";
import Image from "next/image";
import Link from "next/link";
import { BiCar } from "react-icons/bi";
import { BsCart } from "react-icons/bs";
import { GiCarSeat } from "react-icons/gi";
import { PiEngine, PiSeat, PiSeatbelt } from "react-icons/pi";
import { SiTransmission } from "react-icons/si";

interface CarCardProps {
	car: Car;
}

const CarCard = ({ car }: CarCardProps) => {
	return (
		<Link
			href={"/car/" + car.vin}
			key={car.vin}
			className="bg-primary hover:scale-[102%] z-[0] duration-[100ms] rounded-xl  border-third shadow-md shadow-third/50 overflow-clip flex md:flex-row flex-col md:h-[200px] w-full"
		>
			<Image
				src={car.images[0]}
				alt={car.make}
				height={500}
				width={500}
				className="object-cover md:w-[40%] w-full md:h-auto h-[200px]"
			/>
			<div className="md:w-[60%] w-full px-[20px] py-[15px] flex flex-col justify-between md:gap-0 gap-[10px]">
				<div>
					<div className="flex justify-between items-center">
						<h1 className="text-[16pt] font-[500] leading-[110%] text-foreground/90">
							{car.model}
						</h1>
						<h1 className="text-[12pt] font-[500] leading-[110%] text-accent/80">
							{car.make}
						</h1>
					</div>
					<p className="text-foreground-light text-[12pt] leading-[150%]">
						{car.modelYear}
					</p>
				</div>
				<div className="justify-between ml-auto flex w-full items-end">
					<div className="text-foreground-light text-[14pt] flex flex-shrink flex-col gap-y-[5px]">
						<div className="flex gap-[5px] items-center">
							<BiCar />
							<p className="text-[10pt] font-[500] lowercase first-letter:uppercase">
								{car.vehicleClass}
							</p>
						</div>
						<div className="flex gap-[3px] items-center">
							<GiCarSeat />
							<p className="text-[10pt] font-[500]">{car.seats}</p>
						</div>
						<div className="flex gap-[5px] items-center">
							<PiEngine />
							<p className="text-[10pt] font-[500] lowercase first-letter:uppercase">
								{car.engineLayout == "DUAL_MOTOR" ||
								car.engineLayout == "SINGLE_MOTOR" ? (
									car.engineLayout
								) : (
									<>
										{car.engineLayout} {car.cylinders}
									</>
								)}
							</p>
						</div>
					</div>
					<div className="flex flex-col items-end min-w-fit">
						<h1 className="text-accent text-[20pt]">
							${car.pricePerDay}
							<span className="text-accent/60 text-[12pt]">/day</span>
						</h1>
						<p className="text-foreground-light text-[10pt] leading-[100%]">
							Before taxes
						</p>
					</div>
				</div>
			</div>
		</Link>
	);
};

export default CarCard;
