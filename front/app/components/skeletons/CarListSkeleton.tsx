import CarListCardSkeleton from "./CarListCardSkeleton";

/** Skeleton for the full list-view grid on the browse page. */
const CarListSkeleton = () => (
	<div className="grid grid-cols-1 w-full gap-[20px] px-[10px]">
		{Array.from({ length: 8 }).map((_, i) => (
			<CarListCardSkeleton key={i} />
		))}
	</div>
);

export default CarListSkeleton;
