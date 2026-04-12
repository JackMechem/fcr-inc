import { Car } from "@/app/types/CarTypes";
import Image from "next/image";
import Link from "next/link";
import { BiCar } from "react-icons/bi";
import { GiCarSeat } from "react-icons/gi";
import { PiEngine, PiGauge } from "react-icons/pi";
import { SiTransmission } from "react-icons/si";
import { BsFuelPump } from "react-icons/bs";
import { formatEnum } from "@/app/lib/formatEnum";
import { TbManualGearbox } from "react-icons/tb";

const Stat = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
	<div className="flex gap-[5px] items-center">
		<span className="text-[14pt] flex-shrink-0">{icon}</span>
		<p className="text-[10pt] font-[400]">{label}</p>
	</div>
);

const CarListCard = ({ car }: { car: Car }) => {
	const engineLabel =
		car.engineLayout === "DUAL_MOTOR" || car.engineLayout === "SINGLE_MOTOR"
			? formatEnum(car.engineLayout)
			: `${formatEnum(car.engineLayout)} ${car.cylinders}`;

	return (
		<Link
			href={"/car/" + car.vin}
			className="hover:scale-[100.5%] z-[0] duration-[100ms] overflow-visible flex md:flex-row flex-col md:h-[300px] w-full gap-[10px] bg-primary border-third border rounded-xl shadow-sm"
		>
			<Image
				src={car.images[0]}
				alt={car.make}
				height={500}
				width={500}
				className="object-cover md:w-[38%] w-full md:h-auto h-[200px] rounded-l-xl"
			/>
			<div className="md:w-[62%] w-full pl-[20px] pr-[25px] py-[20px] flex flex-col justify-between md:gap-0 gap-[10px]">
				{/* Title row */}
				<div>
					<div className="flex justify-between items-center">
						<h1 className="text-[19pt] font-[400] leading-[110%] text-foreground">
							{car.model}
						</h1>
						<h1 className="text-[14pt] font-[500] leading-[110%] text-accent/60">
							{car.make}
						</h1>
					</div>
					<p className="text-foreground-light/70 text-[12pt] leading-[150%]">
						{car.modelYear}
					</p>
					{/* Features */}
					{car.features?.length > 0 && (
						<div className="flex flex-wrap gap-[6px] mt-[10px] max-w-[500px]">
							{car.features.slice(0, 6).map((f) => (
								<span
									key={f}
									className="text-[9pt] font-[500] text-accent/80 border border-accent/30 rounded-full px-[10px] py-[2px]"
								>
									{f}
								</span>
							))}
						</div>
					)}
				</div>

				{/* Stats + price */}
				<div className="flex justify-between items-end gap-[10px]">
					{/* Two-column stat grid */}
					<div className="grid xl:grid-cols-3 grid-cols-2 gap-x-[25px] gap-y-[12px] text-[10pt] text-accent border border-accent/10 px-[10px] py-[8px] mb-[5px] rounded-xl bg-accent/5">
						<Stat icon={<BiCar />} label={formatEnum(car.vehicleClass)} />
						<Stat icon={<TbManualGearbox />} label={formatEnum(car.transmission)} />
						<Stat icon={<GiCarSeat />} label={`${car.seats} seats`} />
						<Stat icon={<BsFuelPump />} label={formatEnum(car.fuel)} />
						<Stat icon={<PiEngine />} label={engineLabel} />
						<Stat icon={<PiGauge />} label={`${car.mpg} mpg`} />
					</div>

					{/* Price */}
					<div className="flex flex-col items-end min-w-fit">
						<h1 className="text-accent text-[19pt]">
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

export default CarListCard;
