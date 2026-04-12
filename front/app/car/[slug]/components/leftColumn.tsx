import { Car } from "@/app/types/CarTypes";
import Markdown from "react-markdown";
import { formatEnum } from "@/app/lib/formatEnum";
import { BiCar } from "react-icons/bi";
import { GiCarSeat } from "react-icons/gi";
import { PiEngine, PiLightning, PiGauge } from "react-icons/pi";
import { BsFuelPump } from "react-icons/bs";
import { TbArrowAutofitDown, TbManualGearbox, TbWheel } from "react-icons/tb";
import { MdRoofing } from "react-icons/md";
import Spec from "./Spec";
import SpecGroup from "./SpecGroup";

const LeftColumn = ({ carData }: { carData: Car }) => {
	const engineLabel =
		carData.engineLayout === "DUAL_MOTOR" || carData.engineLayout === "SINGLE_MOTOR"
			? formatEnum(carData.engineLayout)
			: `${formatEnum(carData.engineLayout)}-${carData.cylinders}`;

	return (
		<div className="w-full flex flex-col gap-[24px] mt-[20px]">

			{/* Title */}
			<div>
				<h1 className="text-[26pt] font-[700] text-accent leading-[110%]">
					{carData.modelYear}{" "}
					{carData.make}{" "}
					{carData.model}
				</h1>
				<p className="text-foreground-light text-[11pt] mt-[4px] capitalize">
					{formatEnum(carData.vehicleClass)} · {formatEnum(carData.bodyType)}
				</p>
			</div>

			{/* Feature pills */}
			{carData.features?.length > 0 && (
				<div className="flex flex-wrap gap-[8px]">
					{carData.features.map((f, i) => (
						<span
							key={f + i}
							className="text-nowrap bg-accent/10 text-accent border border-accent/20 px-[14px] py-[5px] text-[9.5pt] rounded-full font-[500]"
						>
							{f}
						</span>
					))}
				</div>
			)}

			{/* Specifications card */}
			<div className="card p-[20px] flex flex-col gap-[16px] w-fit self-start">
				<p className="text-foreground text-[11pt] font-[600] pb-[4px] border-b border-third/50">
					Specifications
				</p>

				<div className="flex flex-row flex-wrap gap-[40px]">
					<SpecGroup title="Performance">
						<Spec icon={<PiLightning />} label="Horsepower" value={`${carData.horsepower} hp`} />
						<Spec icon={<TbWheel />} label="Torque" value={`${carData.torque} lb-ft`} />
						<Spec icon={<PiGauge />} label="MPG" value={`${carData.mpg} mpg`} />
					</SpecGroup>

					<SpecGroup title="Drivetrain">
						<Spec icon={<TbManualGearbox />} label="Transmission" value={`${carData.gears}-speed ${formatEnum(carData.transmission)}`} />
						<Spec icon={<TbArrowAutofitDown />} label="Drivetrain" value={formatEnum(carData.drivetrain)} />
						<Spec icon={<PiEngine />} label="Engine" value={engineLabel} />
						<Spec icon={<BsFuelPump />} label="Fuel" value={formatEnum(carData.fuel)} />
					</SpecGroup>

					<SpecGroup title="Details">
						<Spec icon={<BiCar />} label="Body Type" value={formatEnum(carData.bodyType)} />
						<Spec icon={<MdRoofing />} label="Roof" value={formatEnum(carData.roofType)} />
						<Spec icon={<GiCarSeat />} label="Seats" value={`${carData.seats} seats`} />
					</SpecGroup>
				</div>
			</div>

			{/* Description */}
			{carData.description && (
				<div
					className="prose prose-sm max-w-none
					[&_h1]:text-foreground [&_h1]:text-[16pt] [&_h1]:font-[700] [&_h1]:mb-[8px]
					[&_h2]:text-foreground [&_h2]:text-[13pt] [&_h2]:font-[600] [&_h2]:mb-[6px]
					[&_h3]:text-foreground [&_h3]:text-[11.5pt] [&_h3]:font-[600]
					[&_p]:text-foreground [&_p]:text-[11pt] [&_p]:leading-[1.7] [&_p]:mb-[10px]
					[&_strong]:text-foreground [&_strong]:font-[600]
					[&_ul]:list-disc [&_ul]:pl-[20px] [&_ul]:mb-[10px]
					[&_li]:text-foreground [&_li]:text-[11pt] [&_li]:mb-[4px]"
				>
					<Markdown>{carData.description}</Markdown>
				</div>
			)}
		</div>
	);
};

export default LeftColumn;
