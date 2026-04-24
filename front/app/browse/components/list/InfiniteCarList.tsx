"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Car, CarApiParams } from "@/app/types/CarTypes";
import { CartCardInfo, CartProps } from "@/app/types/CartTypes";
import { useCartStore } from "@/stores/cartStore";
import { useUserDashboardStore } from "@/stores/userDashboardStore";
import { fetchCarsPage, getUserReservations } from "../../actions";
import { getAvailability } from "@/app/lib/availability";
import CarCard from "@/app/components/cars/CarListCard";
import CarGridCard from "@/app/components/cars/carGridCard";
import CarListCardSkeleton from "@/app/components/skeletons/CarListCardSkeleton";
import CarGridCardSkeleton from "@/app/components/skeletons/CarGridCardSkeleton";
import styles from "./browseContent.module.css";

const PAGE_SIZE = 8;

interface UserReservation {
	vin: string;
	pickUpMs: number;
	dropOffMs: number;
}

function toMs(t: number | string): number {
    return typeof t === "number" ? t * 1000 : new Date(t).getTime();
}

interface InfiniteCarListProps {
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

const InfiniteCarList = ({ filterParams, layout = "list", fromDate, untilDate }: InfiniteCarListProps) => {
	const [cars, setCars] = useState<Car[]>([]);
	const [carsLoading, setCarsLoading] = useState(true);
	const [loading, setLoading] = useState(false);
	const [hasMore, setHasMore] = useState(false);
	const [datesReady, setDatesReady] = useState(false);
	const availabilityFilter = filterParams.availabilityFilter;
	const [isSmall] = useState(false);
	const sentinelRef = useRef<HTMLDivElement>(null);
	const loadingRef = useRef(false);
	const pageRef = useRef(1);
	const hasMoreRef = useRef(false);
	const fetchNextPageRef = useRef<() => void>(() => {});
	const pendingFetchRef = useRef(false);

	const cartItems = useCartStore((s) => s.carData);

	// User reservation overlap tracking
	const { isAuthenticated, sessionToken, stripeUserId } = useUserDashboardStore();
	const [userReservations, setUserReservations] = useState<UserReservation[]>([]);

	// Fetch first page of cars client-side
	useEffect(() => {
		setCarsLoading(true);
		setCars([]);
		pageRef.current = 1;
		setHasMore(false);

		fetchCarsPage({ ...filterParams, pageSize: filterParams.pageSize ?? PAGE_SIZE, page: 1 }).then((result) => {
			setCars(result.data);
			const more = result.totalPages > 1;
			hasMoreRef.current = more;
			setHasMore(more);
			setCarsLoading(false);
		}).catch(() => {
			setCarsLoading(false);
		});
	// Stringify to detect param changes without deep equality
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [JSON.stringify(filterParams)]);

	useEffect(() => {
		if (!isAuthenticated || !sessionToken || !stripeUserId) {
			setUserReservations([]);
			setDatesReady(true);
			return;
		}
		getUserReservations(stripeUserId)
			.then((data) => {
				setUserReservations(
					data
						.filter((r) => r.car?.vin)
						.map((r) => ({
							vin: r.car!.vin,
							pickUpMs: toMs(r.pickUpTime),
							dropOffMs: toMs(r.dropOffTime),
						}))
				);
			})
			.finally(() => setDatesReady(true));
	}, [isAuthenticated, sessionToken, stripeUserId]);

	// Cart items (any car) whose rental dates overlap the current browse range
	const cartConflicts = (fromDate && untilDate)
		? cartItems.filter((item) => cartItemOverlapsBrowse(item, fromDate, untilDate))
		: [];

	const getCartInfo = (car: Car): CartCardInfo => {
		const cartItem = cartItems.find((c) => c.vin === car.vin);
		// Conflicts are other cars (not this one) in the cart overlapping the browse range
		const conflicts = cartConflicts.filter((c) => c.vin !== car.vin);

		// Check if the user has an existing reservation for this car that overlaps the browse range
		let userReserved = false;
		if (fromDate && untilDate && userReservations.length > 0) {
			const browseFrom = new Date(fromDate).getTime();
			const browseUntil = new Date(untilDate).getTime();
			userReserved = userReservations.some(
				(r) => r.vin === car.vin && browseFrom < r.dropOffMs && browseUntil > r.pickUpMs
			);
		}

		return {
			cartItem,
			cartConflicts: conflicts.length > 0 ? conflicts : undefined,
			userReserved,
		};
	};


	const fetchNextPage = useCallback(async () => {
		if (loadingRef.current || !hasMoreRef.current) {
			if (loadingRef.current) pendingFetchRef.current = true;
			return;
		}
		loadingRef.current = true;
		setLoading(true);
		const nextPage = pageRef.current + 1;
		const result = await fetchCarsPage({ ...filterParams, pageSize: filterParams.pageSize ?? PAGE_SIZE, page: nextPage });
		setCars((prev) => {
			const seen = new Set(prev.map((c) => c.vin));
			return [...prev, ...result.data.filter((c) => !seen.has(c.vin))];
		});
		pageRef.current = nextPage;
		const more = nextPage < result.totalPages;
		hasMoreRef.current = more;
		setHasMore(more);
		loadingRef.current = false;
		setLoading(false);
		if (pendingFetchRef.current) {
			pendingFetchRef.current = false;
			fetchNextPageRef.current();
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [JSON.stringify(filterParams)]);

	// Keep the ref up-to-date so the observer always calls the latest version
	useEffect(() => { fetchNextPageRef.current = fetchNextPage; }, [fetchNextPage]);

	// Set up observer once — use ref so it never needs to reconnect
	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => { if (entries[0].isIntersecting) fetchNextPageRef.current(); },
			{ rootMargin: "0px 0px 300px 0px" }
		);
		if (sentinelRef.current) observer.observe(sentinelRef.current);
		return () => observer.disconnect();
	}, []);

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
	const skeletonCount = filterParams.pageSize ?? PAGE_SIZE;

	if (carsLoading) {
		return (
			<>
				<div className={isList ? styles.listGrid : styles.carGrid}>
					{Array.from({ length: skeletonCount }, (_, i) =>
						isList ? <CarListCardSkeleton key={i} /> : <CarGridCardSkeleton key={i} />
					)}
				</div>
				<div ref={sentinelRef} />
			</>
		);
	}

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
							datesReady={datesReady}
						/>
					) : (
						<CarGridCard
							key={car.vin}
							car={car}
							fromDate={fromDate}
							untilDate={untilDate}
							cartInfo={getCartInfo(car)}
							datesReady={datesReady}
						/>
					)
				)}
				{loading && Array.from({ length: PAGE_SIZE }, (_, i) =>
					isList ? <CarListCardSkeleton key={i} /> : <CarGridCardSkeleton key={i} />
				)}
			</div>
			<div ref={sentinelRef} className={styles.sentinel} />
		</>
	);
};

export default InfiniteCarList;
