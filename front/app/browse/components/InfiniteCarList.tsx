"use client";
import { useEffect, useRef, useState } from "react";
import { Car, CarApiParams } from "@/app/types/CarTypes";
import { CartCardInfo, CartProps } from "@/app/types/CartTypes";
import { useCartStore } from "@/stores/cartStore";
import { fetchCarsPage } from "../actions";
import { getAvailability } from "@/app/lib/availability";
import CarCard from "@/app/components/cars/CarListCard";
import CarGridCard from "@/app/components/cars/carGridCard";
import CarListCardSkeleton from "@/app/components/skeletons/CarListCardSkeleton";
import CarGridCardSkeleton from "@/app/components/skeletons/CarGridCardSkeleton";
import styles from "./browseContent.module.css";

interface InfiniteCarListProps {
	initialCars: Car[];
	totalPages: number;
	filterParams: CarApiParams;
	layout?: "list" | "grid";
	fromDate?: string;
	untilDate?: string;
}

/** Returns true if the cart item's rental dates overlap with the browse date range. */
function cartItemOverlapsBrowse(item: CartProps, fromDate: string, untilDate: string): boolean {
	if (!item.startDate || !item.endDate) return false;
	const cartStart = new Date(item.startDate).getTime();
	const cartEnd = new Date(item.endDate).getTime();
	const browseFrom = new Date(fromDate).getTime();
	const browseUntil = new Date(untilDate).getTime();
	return browseFrom < cartEnd && browseUntil > cartStart;
}

const InfiniteCarList = ({ initialCars, totalPages, filterParams, layout = "list", fromDate, untilDate }: InfiniteCarListProps) => {
	const [cars, setCars] = useState<Car[]>(initialCars);
	const [loading, setLoading] = useState(false);
	const [hasMore, setHasMore] = useState(totalPages > 1);
	const availabilityFilter = filterParams.availabilityFilter;
	const [isSmall] = useState(false);
	const sentinelRef = useRef<HTMLDivElement>(null);
	const loadingRef = useRef(false);
	const pageRef = useRef(1);

	const cartItems = useCartStore((s) => s.carData);

	// Cart items (any car) whose rental dates overlap the current browse range
	const cartConflicts = (fromDate && untilDate)
		? cartItems.filter((item) => cartItemOverlapsBrowse(item, fromDate, untilDate))
		: [];

	const getCartInfo = (car: Car): CartCardInfo => {
		const cartItem = cartItems.find((c) => c.vin === car.vin);
		// Conflicts are other cars (not this one) in the cart overlapping the browse range
		const conflicts = cartConflicts.filter((c) => c.vin !== car.vin);
		return {
			cartItem,
			cartConflicts: conflicts.length > 0 ? conflicts : undefined,
		};
	};


	const fetchNextPage = async () => {
		if (loadingRef.current || !hasMore) return;
		loadingRef.current = true;
		setLoading(true);
		const nextPage = pageRef.current + 1;
		const result = await fetchCarsPage({ ...filterParams, page: nextPage });
		setCars((prev) => {
			const seen = new Set(prev.map((c) => c.vin));
			return [...prev, ...result.data.filter((c) => !seen.has(c.vin))];
		});
		pageRef.current = nextPage;
		setHasMore(nextPage < totalPages);
		loadingRef.current = false;
		setLoading(false);
	};

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => { if (entries[0].isIntersecting) fetchNextPage(); },
			{ rootMargin: "200px" }
		);
		if (sentinelRef.current) observer.observe(sentinelRef.current);
		return () => observer.disconnect();
	}, [hasMore]);

	// Client-side availability filter
	const filterCar = (car: Car) => {
		if (!availabilityFilter || !fromDate || !untilDate) return true;
		const { status } = getAvailability(car, fromDate, untilDate);
		if (availabilityFilter === "available") return status === "available";
		if (availabilityFilter === "hide_unavailable") return status !== "unavailable";
		return true;
	};

	const visibleCars = cars.filter(filterCar);

	// If all loaded cars are filtered out and more pages exist, auto-fetch
	useEffect(() => {
		if (availabilityFilter && fromDate && untilDate && visibleCars.length === 0 && hasMore && !loading) {
			fetchNextPage();
		}
	}, [visibleCars.length, hasMore, loading]);

	const isList = layout === "list" && !isSmall;

	return (
		<>
			<div className={isList ? styles.listGrid : styles.carGrid}>
				{visibleCars.map((car) =>
					isList ? (
						<CarCard
							key={car.vin}
							car={car}
							fromDate={fromDate}
							untilDate={untilDate}
							cartInfo={getCartInfo(car)}
						/>
					) : (
						<CarGridCard
							key={car.vin}
							car={car}
							fromDate={fromDate}
							untilDate={untilDate}
							cartInfo={getCartInfo(car)}
						/>
					)
				)}
				{loading && (
					isList ? (
						<>
							<CarListCardSkeleton />
							<CarListCardSkeleton />
						</>
					) : (
						<>
							<CarGridCardSkeleton />
							<CarGridCardSkeleton />
							<CarGridCardSkeleton />
							<CarGridCardSkeleton />
						</>
					)
				)}
			</div>
			{hasMore && <div ref={sentinelRef} className={styles.sentinel} />}
		</>
	);
};

export default InfiniteCarList;
