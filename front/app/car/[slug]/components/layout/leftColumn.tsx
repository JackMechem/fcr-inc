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
import StarRating from "@/app/components/reviews/StarRating";
import EditCarButton from "./EditCarButton";
import styles from "../carDetail.module.css";
import reviewStyles from "@/app/components/reviews/reviews.module.css";

const fmtDate = (iso: string) =>
	new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

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
			<div className={reviewStyles.reviewsSection}>
				<p className={reviewStyles.reviewsSectionTitle}>
					Reviews
					{reviews.length > 0 && (
						<StarRating
							average={reviews.reduce((s, r) => s + r.stars, 0) / reviews.length}
							count={reviews.length}
							size="sm"
						/>
					)}
				</p>
				{reviews.length === 0 ? (
					<p className={reviewStyles.reviewsEmpty}>No reviews yet for this vehicle.</p>
				) : (
					<div className={reviewStyles.reviewsList}>
						{reviews.map((r) => {
							const authorName =
								typeof r.account === "object" && r.account !== null
									? (r.account as { name?: string }).name ?? "Anonymous"
									: "Anonymous";
							return (
								<div key={r.reviewId} className={reviewStyles.reviewCard}>
									<div className={reviewStyles.reviewHeader}>
										<div className={reviewStyles.reviewTitleStars}>
											<StarRating average={r.stars} size="sm" />
											<p className={reviewStyles.reviewTitle}>{r.title}</p>
										</div>
										<span className={reviewStyles.reviewMeta}>{fmtDate(r.publishedDate)}</span>
									</div>
									{r.bodyOfText && (
										<p className={reviewStyles.reviewBody}>{r.bodyOfText}</p>
									)}
									<p className={reviewStyles.reviewDuration}>
										{authorName} · {r.rentalDuration} day rental
									</p>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
};

export default LeftColumn;
