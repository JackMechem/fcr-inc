import { Car } from "@/app/types/CarTypes";
import { CartCardInfo } from "@/app/types/CartTypes";
import Image from "next/image";
import Link from "next/link";
import { BiCar } from "react-icons/bi";
import { GiCarSeat } from "react-icons/gi";
import { PiEngine } from "react-icons/pi";
import { getAvailability } from "@/app/lib/availability";
import styles from "./carGridCard.module.css";

const fmtDate = (iso: string) =>
	new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

const CarGridCard = ({
	car,
	fromDate,
	untilDate,
	cartInfo,
}: {
	car: Car;
	fromDate?: string;
	untilDate?: string;
	cartInfo?: CartCardInfo;
}) => {
	const { status } = getAvailability(car, fromDate, untilDate);
	const { cartItem, cartConflicts } = cartInfo ?? {};
	const hasCartConflict = !cartItem && !!cartConflicts?.length;

	return (
		<Link href={`/car/${car.vin}`} className={styles.card}>
			<Image
				width={400}
				height={250}
				alt={`${car.make} ${car.model}`}
				src={car.images[0]}
				className={styles.image}
				loading="lazy"
			/>
			<div className={styles.body}>
				<div className={styles.titleGroup}>
					<h2 className={styles.carName}>
						{car.make} {car.model}
					</h2>
					<p className={styles.carYear}>{car.modelYear}</p>
				</div>
				<div className={styles.stats}>
					<div className={styles.stat}>
						<BiCar />
						<p className={styles.statCapitalize}>{car.vehicleClass}</p>
					</div>
					<div className={styles.stat}>
						<GiCarSeat />
						<p>{car.seats} seats</p>
					</div>
					<div className={styles.stat}>
						<PiEngine />
						<p className={styles.statCapitalize}>
							{car.engineLayout === "DUAL_MOTOR" || car.engineLayout === "SINGLE_MOTOR"
								? car.engineLayout
								: `${car.engineLayout} ${car.cylinders}`}
						</p>
					</div>
				</div>

				{cartItem?.startDate && cartItem?.endDate && (
					<p className={styles.inCartDates}>
						Cart: {fmtDate(cartItem.startDate)} – {fmtDate(cartItem.endDate)}
					</p>
				)}
				{hasCartConflict && cartConflicts!.map((c) => (
					<p key={c.vin} className={styles.cartConflictDates}>
						{c.make} {c.model}
						{c.startDate && c.endDate ? `: ${fmtDate(c.startDate)} – ${fmtDate(c.endDate)}` : " in cart"}
					</p>
				))}

				<div className={styles.priceRow}>
					<h2 className={styles.price}>
						${car.pricePerDay}
						<span className={styles.priceUnit}>/day</span>
					</h2>
					<div className={styles.badgeGroup}>
						{cartItem && <span className={styles.badgeInCart}>In Cart</span>}
						{hasCartConflict ? (
							<span
								className={styles.badgeCartConflict}
								data-tooltip="You can't reserve more than one car at a time"
							>
								Cart Conflict
							</span>
						) : (
							<>
								{status === "available" && (
									<span className={styles.badgeAvailable}>Available</span>
								)}
								{status === "partial" && (
									<span className={styles.badgePartial}>Partial</span>
								)}
								{status === "unavailable" && (
									<span className={styles.badgeUnavailable}>Unavailable</span>
								)}
							</>
						)}
					</div>
				</div>
			</div>
		</Link>
	);
};

export default CarGridCard;
