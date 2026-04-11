"use client";
import { useEffect, useRef, useState } from "react";
import { Car, CarApiParams } from "@/app/types/CarTypes";
import { fetchCarsPage } from "../actions";
import CarCard from "./carCard";
import CarGridCard from "@/app/components/cars/carGridCard";

const CarListSkeleton = () => (
	<div className="flex flex-col md:flex-row h-auto w-full gap-[10px]">
		<div className="md:w-[40%] w-full h-[300px] rounded-xl bg-third animate-pulse" />
		<div className="md:w-[60%] w-full px-[20px] py-[15px] flex flex-col justify-between gap-[10px] shadow-[0px_1px_8px_-3px] shadow-accent/30 bg-accent/3 rounded-xl">
			<div className="flex flex-col gap-[8px]">
				<div className="flex justify-between">
					<div className="h-[24px] w-[40%] bg-third rounded animate-pulse" />
					<div className="h-[20px] w-[25%] bg-third rounded animate-pulse" />
				</div>
				<div className="h-[16px] w-[20%] bg-third rounded animate-pulse" />
			</div>
			<div className="flex justify-between items-end">
				<div className="flex flex-col gap-[8px]">
					<div className="h-[14px] w-[80px] bg-third rounded animate-pulse" />
					<div className="h-[14px] w-[50px] bg-third rounded animate-pulse" />
					<div className="h-[14px] w-[70px] bg-third rounded animate-pulse" />
				</div>
				<div className="flex flex-col items-end gap-[6px]">
					<div className="h-[32px] w-[110px] bg-third rounded animate-pulse" />
					<div className="h-[12px] w-[70px] bg-third rounded animate-pulse" />
				</div>
			</div>
		</div>
	</div>
);

const CarGridSkeleton = () => (
	<div className="rounded-xl overflow-hidden bg-primary shadow-md flex flex-col">
		<div className="w-full h-[180px] bg-third animate-pulse" />
		<div className="px-[16px] py-[14px] flex flex-col gap-[10px]">
			<div className="flex flex-col gap-[6px]">
				<div className="h-[18px] w-[70%] bg-third rounded animate-pulse" />
				<div className="h-[14px] w-[30%] bg-third rounded animate-pulse" />
			</div>
			<div className="flex flex-col gap-[6px]">
				<div className="h-[13px] w-[50%] bg-third rounded animate-pulse" />
				<div className="h-[13px] w-[40%] bg-third rounded animate-pulse" />
				<div className="h-[13px] w-[55%] bg-third rounded animate-pulse" />
			</div>
			<div className="flex justify-between items-center pt-[6px]">
				<div className="h-[22px] w-[70px] bg-third rounded animate-pulse" />
				<div className="h-[28px] w-[80px] bg-third rounded-full animate-pulse" />
			</div>
		</div>
	</div>
);

interface InfiniteCarListProps {
	initialCars: Car[];
	totalPages: number;
	filterParams: CarApiParams;
	layout?: "list" | "grid";
}

const InfiniteCarList = ({ initialCars, totalPages, filterParams, layout = "list" }: InfiniteCarListProps) => {
	const [cars, setCars] = useState<Car[]>(initialCars);
	const [loading, setLoading] = useState(false);
	const [hasMore, setHasMore] = useState(totalPages > 1);
	const [isSmall, setIsSmall] = useState(() =>
		typeof window !== "undefined" ? !window.matchMedia("(min-width: 640px)").matches : false
	);
	const sentinelRef = useRef<HTMLDivElement>(null);
	const loadingRef = useRef(false);
	const pageRef = useRef(1);

	useEffect(() => {
		const mq = window.matchMedia("(min-width: 640px)");
		const handler = (e: MediaQueryListEvent) => setIsSmall(!e.matches);
		mq.addEventListener("change", handler);
		return () => mq.removeEventListener("change", handler);
	}, []);

	useEffect(() => {
		const observer = new IntersectionObserver(
			async (entries) => {
				if (!entries[0].isIntersecting || loadingRef.current) return;

				loadingRef.current = true;
				setLoading(true);

				const nextPage = pageRef.current + 1;
				const result = await fetchCarsPage({ ...filterParams, page: nextPage });

				setCars((prev) => {
					const seen = new Set(prev.map((c) => c.vin));
					return [...prev, ...result.data.filter((c) => !seen.has(c.vin))];
				});
				pageRef.current = nextPage;
				const more = nextPage < totalPages;
				setHasMore(more);
				if (!more) observer.disconnect();

				loadingRef.current = false;
				setLoading(false);
			},
			{ rootMargin: "200px" }
		);

		if (sentinelRef.current) observer.observe(sentinelRef.current);
		return () => observer.disconnect();
	}, []);

	const isList = layout === "list" && !isSmall;

	return (
		<>
			<div
				className={
					isList
						? "grid xl:grid-cols-1 grid-cols-1 w-full gap-[20px] px-[10px] h-auto text-foreground"
						: "grid 2xl:grid-cols-4 xl:grid-cols-3 sm:grid-cols-2 grid-cols-1 w-full gap-[16px] px-[10px] h-auto text-foreground"
				}
			>
				{cars.map((car) =>
					isList ? (
						<CarCard key={car.vin} car={car} />
					) : (
						<CarGridCard key={car.vin} car={car} />
					)
				)}
				{loading && (
					isList ? (
						<>
							<CarListSkeleton />
							<CarListSkeleton />
						</>
					) : (
						<>
							<CarGridSkeleton />
							<CarGridSkeleton />
							<CarGridSkeleton />
							<CarGridSkeleton />
						</>
					)
				)}
			</div>
			{hasMore && <div ref={sentinelRef} className="h-[1px]" />}
		</>
	);
};

export default InfiniteCarList;
