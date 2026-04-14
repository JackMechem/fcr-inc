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
import styles from "./CarListCard.module.css";

const Stat = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
	<div className={styles.stat}>
		<span className={styles.statIcon}>{icon}</span>
		<p className={styles.statLabel}>{label}</p>
	</div>
);

const CarListCard = ({ car }: { car: Car }) => {
	const engineLabel =
		car.engineLayout === "DUAL_MOTOR" || car.engineLayout === "SINGLE_MOTOR"
			? formatEnum(car.engineLayout)
			: `${formatEnum(car.engineLayout)} ${car.cylinders}`;

	const thumbs = car.images.slice(1, 5);
	const hasGrid = thumbs.length > 0;

	return (
		<Link href={"/car/" + car.vin} className={styles.card}>
			<div className={styles.imageWrapper}>
				<Image
					src={car.images[0]}
					alt={car.make}
					fill
					className={styles.image}
					sizes="(min-width: 768px) 40vw, 100vw"
				/>
				{hasGrid && (
					<div className={styles.thumbGrid}>
						{thumbs.map((src, i) => (
							<div key={i} className={styles.thumbCell}>
								<Image
									src={src}
									alt={`${car.make} ${i + 2}`}
									fill
									className={styles.thumbImage}
									sizes="20vw"
								/>
							</div>
						))}
					</div>
				)}
			</div>
			<div className={styles.body}>
				{/* Title row */}
				<div>
					<div className={styles.titleRow}>
						<h1 className={styles.carModel}>{car.model}</h1>
						<h1 className={styles.carMake}>{car.make}</h1>
					</div>
					<p className={styles.carYear}>{car.modelYear}</p>
					{car.features?.length > 0 && (
						<div className={styles.features}>
							{car.features.slice(0, 6).map((f) => (
								<span key={f} className={styles.featureTag}>{f}</span>
							))}
						</div>
					)}
				</div>

				{/* Stats + price */}
				<div className={styles.bottomRow}>
					<div className={styles.statsGrid}>
						<Stat icon={<BiCar />} label={formatEnum(car.vehicleClass)} />
						<Stat icon={<TbManualGearbox />} label={formatEnum(car.transmission)} />
						<Stat icon={<GiCarSeat />} label={`${car.seats} seats`} />
						<Stat icon={<BsFuelPump />} label={formatEnum(car.fuel)} />
						<Stat icon={<PiEngine />} label={engineLabel} />
						<Stat icon={<PiGauge />} label={`${car.mpg} mpg`} />
					</div>

					<div className={styles.priceGroup}>
						<h1 className={styles.price}>
							${car.pricePerDay}
							<span className={styles.priceUnit}>/day</span>
						</h1>
						<p className={styles.priceNote}>Before taxes</p>
					</div>
				</div>
			</div>
		</Link>
	);
};

export default CarListCard;
