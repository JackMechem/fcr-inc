import { BiCar } from "react-icons/bi";
import { GiCarSeat } from "react-icons/gi";
import { PiEngine, PiGauge } from "react-icons/pi";
import { BsFuelPump } from "react-icons/bs";
import { TbManualGearbox } from "react-icons/tb";
import shimmerStyles from "../cars/CarImageFill.module.css";
import styles from "../cars/CarListCard.module.css";
import sk from "./skeletons.module.css";

/** Skeleton line — place inside any text element to inherit its font-size via 1em height */
const Line = ({ w }: { w: string | number }) => (
	<span className={sk.pulse} style={{ display: "block", height: "1em", width: w, borderRadius: 4 }} />
);

/** Skeleton line for use inside the accent-colored stats grid */
const LightLine = ({ w }: { w: string | number }) => (
	<span className={sk.pulseLight} style={{ display: "block", height: "1em", width: w, borderRadius: 4 }} />
);

const Shimmer = ({ small }: { small?: boolean }) => (
	<div className={shimmerStyles.shimmer}>
		<span className={`${shimmerStyles.shimmerIcon} ${small ? shimmerStyles.shimmerIconSm : ""}`}>
			<BiCar />
		</span>
	</div>
);

const CarListCardSkeleton = () => (
	<div className={styles.card} style={{ pointerEvents: "none" }}>
		<div className={styles.imageWrapper}>
			<div className={styles.mainImageWrapper}>
				<Shimmer />
			</div>
			<div className={styles.thumbGrid}>
				<div className={styles.thumbCell}><Shimmer small /></div>
				<div className={styles.thumbCell}><Shimmer small /></div>
			</div>
		</div>

		<div className={styles.body}>
			<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
				<div className={styles.titleRow}>
					<h1 className={styles.carModel}><Line w={180} /></h1>
					<h1 className={styles.carMake}><Line w={80} /></h1>
				</div>

				<div className={styles.yearAvailabilityRow}>
					<p className={styles.carYear}><Line w="3ch" /></p>
					<span className={sk.pulse} style={{ display: "block", height: 20, width: 72, borderRadius: 9999 }} />
				</div>

				{/* Rating stars */}
				<div style={{ display: "flex", gap: 4 }}>
					{Array.from({ length: 5 }).map((_, i) => (
						<span key={i} className={sk.pulse} style={{ display: "inline-block", height: 10, width: 10, borderRadius: 9999 }} />
					))}
				</div>

				{/* Feature tags */}
				<div className={styles.features} style={{ marginTop: 0 }}>
					{[70, 55, 88, 62, 76].map((w, i) => (
						<span key={i} className={sk.pulse} style={{ display: "inline-block", height: 22, width: w, borderRadius: 9999 }} />
					))}
				</div>
			</div>

			<div className={styles.statsDivider} />

			<div className={styles.bottomRow}>
				<div className={styles.statsGrid} style={{ visibility: "hidden" }}>
					{([<BiCar />, <TbManualGearbox />, <GiCarSeat />, <BsFuelPump />, <PiEngine />, <PiGauge />] as React.ReactNode[]).map((icon, i) => (
						<div key={i} className={styles.stat}>
							<span className={styles.statIcon}>{icon}</span>
							<p className={styles.statLabel}><LightLine w="75%" /></p>
						</div>
					))}
				</div>

				<div className={styles.priceGroup}>
					<h1 className={styles.price}><Line w="90px" /></h1>
					<p className={styles.priceNote}><Line w="65px" /></p>
				</div>
			</div>
		</div>
	</div>
);

export default CarListCardSkeleton;
