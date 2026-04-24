"use client";

import DatePicker from "@/app/components/DatePicker";
import { useHydrated } from "@/app/hooks/useHydrated";
import { CartProps } from "@/app/types/CartTypes";
import { Car } from "@/app/types/CarTypes";
import { useCartStore } from "@/stores/cartStore";
import { useBookmarkStore, toggleBookmark as toggleBookmarkApi } from "@/stores/bookmarkStore";
import { useUserDashboardStore } from "@/stores/userDashboardStore";
import { useState, useEffect } from "react";
import { getStoredDates } from "@/app/lib/browseStorage";
import { getAvailability, formatConflicts } from "@/app/lib/availability";
import { BsBookmark, BsBookmarkFill } from "react-icons/bs";
import styles from "../carDetail.module.css";

const parseStoredDate = (val: string | null): Date | undefined => {
	if (!val) return undefined;
	const d = new Date(val);
	return isNaN(d.getTime()) ? undefined : d;
};

const toDateStr = (d: Date | undefined): string | undefined =>
	d ? d.toISOString().split("T")[0] : undefined;

const carToCartProps = (car: Car, startDate?: Date, endDate?: Date): CartProps => ({
	vin: car.vin,
	make: car.make,
	model: car.model,
	pricePerDay: car.pricePerDay,
	image: car.images[0] ?? undefined,
	startDate: startDate?.toISOString(),
	endDate: endDate?.toISOString(),
});

// ── Right column ──────────────────────────────────────────────────────────────

const RightColumn = ({ carData }: { carData: Car }) => {
	const { addCar, removeCar, inCart } = useCartStore();
	const bookmarked = useBookmarkStore((s) => s.isBookmarked(carData.vin));
	const { isAuthenticated, accountId } = useUserDashboardStore();
	const isInCart = inCart(carData.vin);
	const [startDate, setStartDate] = useState<Date | undefined>(() => {
		const stored = getStoredDates();
		return parseStoredDate(stored.get("fromDate"));
	});
	const [endDate, setEndDate] = useState<Date | undefined>(() => {
		const stored = getStoredDates();
		return parseStoredDate(stored.get("untilDate"));
	});
	const hydrated = useHydrated();

	const reservedRanges = (carData.reservationDates ?? []).map(([start, end]) => ({
		from: new Date(start * 1000),
		to: new Date(end * 1000),
	}));

	const { status, conflicts } = getAvailability(carData, toDateStr(startDate), toDateStr(endDate));

	// If the prefilled dates are fully unavailable, clear them so the user starts fresh
	useEffect(() => {
		if (!startDate || !endDate) return;
		const { status } = getAvailability(carData, toDateStr(startDate), toDateStr(endDate));
		if (status === "unavailable") {
			setStartDate(undefined);
			setEndDate(undefined);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [startDate, endDate]);

	const isPartial = status === "partial";
	const canAdd = isInCart || (!!startDate && !!endDate && !isPartial);

	const handleAddToCart = () => {
		if (isInCart) { removeCar(carData.vin); return; }
		addCar(carToCartProps(carData, startDate, endDate));
	};

	if (!hydrated) return null;

	return (
		<div className={`card ${styles.rightCol}`}>
			{/* Price */}
			<div className={styles.priceBlock}>
				<p className={styles.priceMain}>
					${carData.pricePerDay}
					<span className={styles.priceSuffix}>/day</span>
				</p>
				<p className={styles.priceSub}>Before taxes</p>
			</div>

			<div className={styles.divider} />

			{/* Date pickers */}
			<div className={styles.tripSection}>
				<div className={styles.tripTitleRow}>
					<p className={styles.tripTitle}>Your Trip</p>
					{status === "available" && (
						<span className={styles.availBadgeGreen}>Available</span>
					)}
					{status === "partial" && (
						<span className={styles.availBadgeYellow}>Partially reserved</span>
					)}
					{status === "unavailable" && (
						<span className={styles.availBadgeRed}>Unavailable</span>
					)}
				</div>
				<div className={styles.datepickerGrid}>
					<div>
						<label className={styles.datepickerLabel}>Trip Start</label>
						<div className={styles.datepickerBox}>
							<DatePicker
								label="Trip Start"
								showLabel={false}
								placeholder="Add date"
								selected={startDate}
								fromDate={new Date()}
								disabledRanges={reservedRanges}
								onSelect={(d) => {
									setStartDate(d);
									if (endDate && d && d > endDate) setEndDate(undefined);
								}}
							/>
						</div>
					</div>
					<div>
						<label className={styles.datepickerLabel}>Trip End</label>
						<div className={styles.datepickerBox}>
							<DatePicker
								label="Trip End"
								showLabel={false}
								placeholder="Add date"
								selected={endDate}
								onSelect={setEndDate}
								fromDate={startDate}
								disabledRanges={reservedRanges}
							/>
						</div>
					</div>
				</div>
				{isPartial && conflicts.length > 0 && (
					<p className={styles.partialWarning}>
						Reserved during your trip: {formatConflicts(conflicts)}. Please adjust your dates.
					</p>
				)}
			</div>

			<div className={styles.divider} />

			{/* Hint */}
			{!isInCart && (!startDate || !endDate) && (
				<p className={styles.hint}>Select trip dates to add to cart</p>
			)}

			{/* CTA */}
			<div className={styles.ctaRow}>
				<button
					disabled={!canAdd}
					onClick={handleAddToCart}
					className={`${styles.ctaBtn} ${isInCart ? styles.ctaBtnRemove : styles.ctaBtnAdd}`}
				>
					{isInCart ? "Remove from cart" : "Add to cart"}
				</button>
				{isAuthenticated && accountId && (
					<button
						onClick={() => {
							toggleBookmarkApi(accountId, {
								vin: carData.vin,
								make: carData.make,
								model: carData.model,
								pricePerDay: carData.pricePerDay,
								image: carData.images[0] ?? undefined,
							});
						}}
						className={styles.bookmarkBtn}
						title={bookmarked ? "Remove bookmark" : "Bookmark"}
					>
						{bookmarked ? <BsBookmarkFill /> : <BsBookmark />}
					</button>
				)}
			</div>
		</div>
	);
};

export default RightColumn;
