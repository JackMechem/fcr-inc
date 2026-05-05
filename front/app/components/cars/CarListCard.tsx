import { Car } from "@/app/types/CarTypes";
import { CartCardInfo } from "@/app/types/CartTypes";
import Link from "next/link";
import CarImageFill from "./CarImageFill";
import { BiCar } from "react-icons/bi";
import { GiCarSeat } from "react-icons/gi";
import { PiEngine, PiGauge } from "react-icons/pi";
import { BsFuelPump } from "react-icons/bs";
import { formatEnum } from "@/app/lib/formatEnum";
import { TbManualGearbox } from "react-icons/tb";
import { getAvailability, formatConflicts } from "@/app/lib/availability";
import BookmarkButton from "@/app/components/buttons/bookmarkButton";
import CarRatingBadge from "@/app/components/reviews/CarRatingBadge";
import styles from "./CarListCard.module.css";

const Stat = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
	<div className={styles.stat}>
		<span className={styles.statIcon}>{icon}</span>
		<p className={styles.statLabel}>{label}</p>
	</div>
);

const fmtDate = (iso: string) =>
	new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

const CarListCard = ({
	car,
	fromDate,
	untilDate,
	cartInfo,
	datesReady = true,
	onPreviewClick,
}: {
	car: Car;
	fromDate?: string;
	untilDate?: string;
	cartInfo?: CartCardInfo;
	datesReady?: boolean;
	onPreviewClick?: () => void;
}) => {
	const engineLabel =
		car.engineLayout === "DUAL_MOTOR" || car.engineLayout === "SINGLE_MOTOR"
			? formatEnum(car.engineLayout)
			: `${formatEnum(car.engineLayout)} ${car.cylinders}`;

	const { status, conflicts } = getAvailability(car, fromDate, untilDate);

	const thumbs = car.images.slice(1, 3);
	const hasGrid = thumbs.length > 0;

	const { cartItem, userReserved } = cartInfo ?? {};

	const handleClick = onPreviewClick
		? (e: React.MouseEvent) => { e.preventDefault(); onPreviewClick(); }
		: undefined;

	return (
		<Link href={"/car/" + car.vin} className={styles.card} onClick={handleClick}>
			<div className={styles.imageWrapper}>
				<div className={styles.mainImageWrapper}>
					<CarImageFill
						src={car.images[0]}
						alt={car.make}
						className={styles.image}
						sizes="(min-width: 768px) 40vw, 100vw"
					/>
				</div>
				{hasGrid && (
					<div className={styles.thumbGrid}>
						{thumbs.map((src, i) => (
							<div key={i} className={styles.thumbCell}>
								<CarImageFill
									src={src}
									alt={`${car.make} ${i + 2}`}
									className={styles.thumbImage}
									sizes="20vw"
									small
								/>
							</div>
						))}
					</div>
				)}
			</div>
			<div className={styles.body}>
				<div>
					<div className={styles.titleRow}>
						<h1 className={styles.carModel}>{car.model}</h1>
						<div className={styles.titleRight}>
							<h1 className={styles.carMake}>{car.make}</h1>
							<BookmarkButton car={{ vin: car.vin, make: car.make, model: car.model, pricePerDay: car.pricePerDay, image: car.images[0] }} variant="inline" />
						</div>
					</div>
					<div className={styles.yearAvailabilityRow}>
						<p className={styles.carYear}>{car.modelYear}</p>
						<CarRatingBadge averageRating={car.averageRating} />
						{!datesReady ? (
							<div className={styles.badgeSkeleton} />
						) : (
							<>
								{cartItem && (
									<span className={styles.badgeInCart}>In Cart</span>
								)}
								{userReserved && <span className={styles.badgeUserReserved}>Your Reservation</span>}
								{car.carStatus === "SERVICE" ? (
									<span className={styles.badgeInService}>In Service</span>
								) : (
									<>
										{status === "available" && (
											<span className={styles.badgeAvailable}>Available</span>
										)}
										{status === "partial" && (
											<span className={styles.badgePartial}>Partially reserved</span>
										)}
										{status === "unavailable" && (
											<span className={styles.badgeUnavailable}>Unavailable</span>
										)}
									</>
								)}
							</>
						)}
					</div>

					{datesReady && cartItem?.startDate && cartItem?.endDate && (
						<p className={styles.inCartDates}>
							Cart: {fmtDate(cartItem.startDate)} – {fmtDate(cartItem.endDate)}
						</p>
					)}
					{datesReady && status === "partial" && conflicts.length > 0 && (
						<p className={styles.conflictDates}>
							Reserved: {formatConflicts(conflicts)}
						</p>
					)}

					{car.features?.length > 0 && (
						<div className={styles.features}>
							{car.features.slice(0, 6).map((f) => (
								<span key={f} className={styles.featureTag}>{f}</span>
							))}
						</div>
					)}
				</div>

				<div className={styles.statsDivider} />
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
