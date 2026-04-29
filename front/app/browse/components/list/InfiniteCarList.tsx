"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Car, CarApiParams } from "@/app/types/CarTypes";
import { CartCardInfo, CartProps } from "@/app/types/CartTypes";
import { useCartStore } from "@/stores/cartStore";
import { useUserDashboardStore } from "@/stores/userDashboardStore";
import { fetchCarsPage, getUserReservations } from "../../actions";
import { getAvailability } from "@/app/lib/availability";
import { saveBrowseListCache, getBrowseListCache } from "@/app/lib/browseListCache";
import CarCard from "@/app/components/cars/CarListCard";
import CarGridCard from "@/app/components/cars/carGridCard";
import styles from "./browseContent.module.css";
import { useBrowsePreviewStore } from "@/stores/browsePreviewStore";
import { useBrowseScrollContainer } from "./BrowseScrollContext";

const LIST_PAGE_SIZE = 12;
const GRID_PAGE_SIZE = 48;

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

function cartItemOverlapsBrowse(item: CartProps, fromDate: string, untilDate: string): boolean {
	if (!item.startDate || !item.endDate) return false;
	const cartStart = new Date(item.startDate).getTime();
	const cartEnd = new Date(item.endDate).getTime();
	const browseFrom = new Date(fromDate).getTime();
	const browseUntil = new Date(untilDate).getTime();
	return browseFrom < cartEnd && browseUntil > cartStart;
}

const InfiniteCarList = ({ filterParams, layout = "list", fromDate, untilDate }: InfiniteCarListProps) => {
	const PAGE_SIZE = layout === "grid" ? GRID_PAGE_SIZE : LIST_PAGE_SIZE;
	const { previewOpen, setSelectedVin } = useBrowsePreviewStore();
	const scrollContainerRef = useBrowseScrollContainer();
	const paramsKey = JSON.stringify(filterParams);

	// Read from in-memory module-level cache (populated on unmount when navigating to a car).
	// This is computed once at mount time and never changes — safe to use in deps comparisons.
	const [cached] = useState(() => getBrowseListCache(paramsKey));

	const [cars, setCars] = useState<Car[]>(cached?.cars ?? []);
	const [carsLoading, setCarsLoading] = useState(cached === null);
	const [loading, setLoading] = useState(false);
	const [hasMore, setHasMore] = useState(cached?.hasMore ?? false);
	const [datesReady, setDatesReady] = useState(false);
	const availabilityFilter = filterParams.availabilityFilter;
	const [isSmall] = useState(false);
	const sentinelRef = useRef<HTMLDivElement>(null);
	const loadingRef = useRef(false);
	const pageRef = useRef(cached?.page ?? 1);
	const hasMoreRef = useRef(cached?.hasMore ?? false);
	const fetchNextPageRef = useRef<() => void>(() => {});
	const pendingFetchRef = useRef(false);

	// Keep live refs for the unmount cleanup so it always captures current values.
	const carsRef = useRef(cars);
	useEffect(() => { carsRef.current = cars; }, [cars]);
	const hasMoreRef2 = useRef(hasMore);
	useEffect(() => { hasMoreRef2.current = hasMore; }, [hasMore]);
	const paramsKeyRef = useRef(paramsKey);
	useEffect(() => { paramsKeyRef.current = paramsKey; }, [paramsKey]);

	// Track scroll position continuously via event listener so the value is always
	// fresh in a ref — reading scrollTop/scrollY during the unmount cleanup is
	// unreliable because the DOM element may already be detached by then.
	const scrollPosRef = useRef(0);
	useEffect(() => {
		const pane = scrollContainerRef?.current;
		if (pane) {
			const onScroll = () => { scrollPosRef.current = pane.scrollTop; };
			pane.addEventListener("scroll", onScroll, { passive: true });
			return () => pane.removeEventListener("scroll", onScroll);
		} else {
			const onScroll = () => { scrollPosRef.current = window.scrollY; };
			window.addEventListener("scroll", onScroll, { passive: true });
			return () => window.removeEventListener("scroll", onScroll);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Save state to the in-memory cache when unmounting (navigating to a car detail page).
	useEffect(() => {
		return () => {
			if (carsRef.current.length > 0) {
				saveBrowseListCache({
					cars: carsRef.current,
					page: pageRef.current,
					hasMore: hasMoreRef2.current,
					scrollY: scrollPosRef.current,
					paramsKey: paramsKeyRef.current,
				});
			}
		};
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Restore scroll position after the car list renders.
	// setTimeout ensures this fires AFTER Next.js's own post-navigation scroll reset.
	useEffect(() => {
		if (!cached?.scrollY) return;
		const id = setTimeout(() => {
			const pane = scrollContainerRef?.current;
			const overflow = pane ? getComputedStyle(pane).overflowY : "";
			const isScrollPane = pane && (overflow === "auto" || overflow === "scroll");
			if (isScrollPane) {
				pane.scrollTop = cached.scrollY;
			} else {
				// On mobile the browser toolbar re-appears on back-navigation, shrinking
				// the viewport and causing the restore to overshoot.
				const mobileOffset = window.innerWidth < 768 ? 120 : 0;
				window.scrollTo({ top: Math.max(0, cached.scrollY - mobileOffset), behavior: "instant" });
			}
		}, 0);
		return () => clearTimeout(id);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const cartItems = useCartStore((s) => s.carData);

	// User reservation overlap tracking
	const { isAuthenticated, sessionToken, stripeUserId } = useUserDashboardStore();
	const [userReservations, setUserReservations] = useState<UserReservation[]>([]);

	// Fetch first page of cars.
	// Skip only when we have cached cars for these exact filter params (navigating back).
	// The skip condition uses only the immutable `cached` value and is safe under
	// React 18 StrictMode's double-invoke of effects.
	useEffect(() => {
		// If the cache already has data for these params, skip the fetch entirely.
		// Any subsequent run of this effect (filter change) will have a different
		// paramsKey, so the condition won't match and we fetch normally.
		if (cached !== null && cached.paramsKey === paramsKey) return;

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
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [paramsKey]);

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

	const cartConflicts = (fromDate && untilDate)
		? cartItems.filter((item) => cartItemOverlapsBrowse(item, fromDate, untilDate))
		: [];

	const getCartInfo = (car: Car): CartCardInfo => {
		const cartItem = cartItems.find((c) => c.vin === car.vin);
		const conflicts = cartConflicts.filter((c) => c.vin !== car.vin);

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
	}, [paramsKey]);

	useEffect(() => { fetchNextPageRef.current = fetchNextPage; }, [fetchNextPage]);

	useEffect(() => {
		// Use the pane element as root when it is the scroll container (desktop fixed layout).
		// Fall back to null (viewport) on mobile where the page itself scrolls.
		const el = scrollContainerRef?.current ?? null;
		const overflow = el ? getComputedStyle(el).overflowY : "";
		const root = el && (overflow === "auto" || overflow === "scroll") ? el : null;
		const observer = new IntersectionObserver(
			(entries) => { if (entries[0].isIntersecting) fetchNextPageRef.current(); },
			{ root, rootMargin: "0px 0px 300px 0px" }
		);
		if (sentinelRef.current) observer.observe(sentinelRef.current);
		return () => observer.disconnect();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const filterCar = (car: Car) => {
		if (!availabilityFilter || !fromDate || !untilDate) return true;
		const { status } = getAvailability(car, fromDate, untilDate);
		if (availabilityFilter === "available") return status === "available";
		if (availabilityFilter === "hide_unavailable") return status !== "unavailable";
		return true;
	};

	const visibleCars = cars.filter(filterCar);

	useEffect(() => {
		if (availabilityFilter && fromDate && untilDate && visibleCars.length === 0 && hasMore && !loading) {
			fetchNextPage();
		}
	}, [visibleCars.length, hasMore, loading]);

	const isList = layout === "list" && !isSmall;

	return (
		<>
			{carsLoading ? (
				<div className={styles.initialLoading}>
					<div className={styles.spinner} />
					<p className={styles.loadingLabel}>Finding your next ride…</p>
				</div>
			) : (
				<div className={isList ? styles.listGrid : styles.carGrid}>
					{visibleCars.map((car) => (
						<div key={car.vin}>
							{isList ? (
								<CarCard
									car={car}
									fromDate={fromDate}
									untilDate={untilDate}
									cartInfo={getCartInfo(car)}
									datesReady={datesReady}
									onPreviewClick={previewOpen ? () => setSelectedVin(car.vin) : undefined}
								/>
							) : (
								<CarGridCard
									car={car}
									fromDate={fromDate}
									untilDate={untilDate}
									cartInfo={getCartInfo(car)}
									datesReady={datesReady}
									onPreviewClick={previewOpen ? () => setSelectedVin(car.vin) : undefined}
								/>
							)}
						</div>
					))}
				</div>
			)}
			{loading && (
				<div className={styles.paginationLoading}>
					<div className={styles.spinner} />
				</div>
			)}
			<div ref={sentinelRef} className={styles.sentinel} />
		</>
	);
};

export default InfiniteCarList;
