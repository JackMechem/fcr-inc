"use client";
import { useEffect, useRef, useState } from "react";
import { Car, CarApiParams } from "@/app/types/CarTypes";
import { fetchCarsPage } from "../actions";
import CarCard from "./carCard";

const CarCardSkeleton = () => (
	<div className="flex md:flex-row flex-col md:h-[200px] w-full gap-[10px]">
		<div className="md:w-[40%] w-full md:h-auto h-[200px] rounded-xl bg-third animate-pulse" />
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

interface InfiniteCarListProps {
	initialCars: Car[];
	totalPages: number;
	filterParams: CarApiParams;
}

const InfiniteCarList = ({ initialCars, totalPages, filterParams }: InfiniteCarListProps) => {
	const [cars, setCars] = useState<Car[]>(initialCars);
	const [loading, setLoading] = useState(false);
	const sentinelRef = useRef<HTMLDivElement>(null);
	const loadingRef = useRef(false);
	const pageRef = useRef(1);
	const hasMoreRef = useRef(totalPages > 1);

	useEffect(() => {
		const observer = new IntersectionObserver(
			async (entries) => {
				if (!entries[0].isIntersecting || loadingRef.current || !hasMoreRef.current) return;

				loadingRef.current = true;
				setLoading(true);

				const nextPage = pageRef.current + 1;
				const result = await fetchCarsPage({ ...filterParams, page: nextPage });

				setCars((prev) => [...prev, ...result.data]);
				pageRef.current = nextPage;
				hasMoreRef.current = nextPage < totalPages;

				loadingRef.current = false;
				setLoading(false);
			},
			{ rootMargin: "200px" }
		);

		if (sentinelRef.current) observer.observe(sentinelRef.current);
		return () => observer.disconnect();
	}, []);

	return (
		<>
			<div className="grid xl:grid-cols-2 grid-cols-1 w-full gap-[20px] px-[10px] h-auto text-foreground">
				{cars.map((car) => (
					<CarCard key={car.vin} car={car} />
				))}
				{loading && (
					<>
						<CarCardSkeleton />
						<CarCardSkeleton />
					</>
				)}
			</div>
			{hasMoreRef.current && <div ref={sentinelRef} className="h-[1px]" />}
		</>
	);
};

export default InfiniteCarList;
