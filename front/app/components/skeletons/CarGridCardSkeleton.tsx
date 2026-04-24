import { BiCar } from "react-icons/bi";
import { GiCarSeat } from "react-icons/gi";
import { PiEngine } from "react-icons/pi";
import { BsFuelPump } from "react-icons/bs";
import shimmerStyles from "../cars/CarImageFill.module.css";
import styles from "../cars/carGridCard.module.css";
import sk from "./skeletons.module.css";

const Line = ({ w }: { w: string | number }) => (
	<span className={sk.pulse} style={{ display: "block", height: "1em", width: w, borderRadius: 4 }} />
);

const LightLine = ({ w }: { w: string | number }) => (
	<span className={sk.pulseLight} style={{ display: "block", height: "1em", width: w, borderRadius: 4 }} />
);

const Shimmer = () => (
	<div className={shimmerStyles.shimmer}>
		<span className={shimmerStyles.shimmerIcon}>
			<BiCar />
		</span>
	</div>
);

const CarGridCardSkeleton = () => (
	<div className={styles.card} style={{ pointerEvents: "none" }}>
		<div className={styles.imageWrapper}>
			<Shimmer />
		</div>

		<div className={styles.body}>
			<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
				<div className={styles.titleRow}>
					<h2 className={styles.carModel}><Line w={140} /></h2>
					<h2 className={styles.carMake}><Line w={65} /></h2>
				</div>

				<div className={styles.yearAvailabilityRow}>
					<p className={styles.carYear}><Line w="3ch" /></p>
					<span className={sk.pulse} style={{ display: "block", height: 18, width: 66, borderRadius: 9999 }} />
				</div>

				{/* Rating stars */}
				<div style={{ display: "flex", gap: 4 }}>
					{Array.from({ length: 5 }).map((_, i) => (
						<span key={i} className={sk.pulse} style={{ display: "inline-block", height: 10, width: 10, borderRadius: 9999 }} />
					))}
				</div>

				{/* Feature tags */}
				<div className={styles.features} style={{ marginTop: 0 }}>
					{[60, 48, 70, 52].map((w, i) => (
						<span key={i} className={sk.pulse} style={{ display: "inline-block", height: 22, width: w, borderRadius: 9999 }} />
					))}
				</div>
			</div>

			<div className={styles.bottomRow}>
				<div className={styles.statsGrid} style={{ visibility: "hidden" }}>
					{([<BiCar />, <GiCarSeat />, <PiEngine />, <BsFuelPump />] as React.ReactNode[]).map((icon, i) => (
						<div key={i} className={styles.stat}>
							<span className={styles.statIcon}>{icon}</span>
							<p className={styles.statLabel}><LightLine w="75%" /></p>
						</div>
					))}
				</div>

				<div className={styles.priceGroup}>
					<h2 className={styles.price}><Line w="80px" /></h2>
					<p className={styles.priceNote}><Line w="60px" /></p>
				</div>
			</div>
		</div>
	</div>
);

export default CarGridCardSkeleton;
