import { Car } from "@/app/types/CarTypes";
import { Review } from "@/app/types/ReviewTypes";
import Markdown from "react-markdown";

import { formatEnum } from "@/app/lib/formatEnum";
import { BiCar } from "react-icons/bi";
import { GiCarSeat } from "react-icons/gi";
import { PiEngine, PiLightning, PiGauge } from "react-icons/pi";
import { BsFuelPump } from "react-icons/bs";
import { TbArrowAutofitDown, TbManualGearbox, TbWheel } from "react-icons/tb";
import { MdRoofing } from "react-icons/md";
import Spec from "../specs/Spec";
import SpecGroup from "../specs/SpecGroup";
import ReviewsSection from "./ReviewsSection";
import EditCarButton from "./EditCarButton";
import styles from "../carDetail.module.css";


const LeftColumn = ({ carData, reviews = [] }: { carData: Car; reviews?: Review[] }) => {
	const engineLabel =
		carData.engineLayout === "DUAL_MOTOR" || carData.engineLayout === "SINGLE_MOTOR"
			? formatEnum(carData.engineLayout)
			: `${formatEnum(carData.engineLayout)}-${carData.cylinders}`;

	return (
		<div className={styles.leftCol}>

			{/* Title */}
			<div className={styles.titleBlock}>
				<div className={styles.titleRow}>
					<div>
						<h1 className={styles.carTitle}>
							{carData.modelYear}{" "}
							{carData.make}{" "}
							{carData.model}
						</h1>
						<p className={styles.carSubtitle}>
							{formatEnum(carData.vehicleClass)} · {formatEnum(carData.bodyType)}
						</p>
					</div>
					<EditCarButton vin={carData.vin} />
				</div>
			</div>

			{/* Feature pills */}
			{carData.features?.length > 0 && (
				<div className={styles.featurePills}>
					{carData.features.map((f, i) => (
						<span key={f + i} className={styles.featurePill}>{f}</span>
					))}
				</div>
			)}

			{/* Specifications card */}
			<div className={`card ${styles.specsCard}`}>
				<p className={styles.specsCardTitle}>Specifications</p>

				<div className={styles.specsGrid}>
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
				<div className={styles.descriptionSection}>
					<p className={styles.descriptionTitle}>Description</p>
					<div className={styles.description}>
						<Markdown>{carData.description}</Markdown>
					</div>
				</div>
			)}

			{/* Reviews */}
			<ReviewsSection
				initialReviews={reviews}
				vin={carData.vin}
				carName={`${carData.modelYear} ${carData.make} ${carData.model}`}
			/>
		</div>
	);
};

export default LeftColumn;
