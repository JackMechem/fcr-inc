import CarGridCardSkeleton from "./CarGridCardSkeleton";

/** Skeleton for the full grid layout on the browse page. */
const CarGridSkeleton = () => (
	<div className="grid 2xl:grid-cols-4 xl:grid-cols-3 sm:grid-cols-2 grid-cols-1 w-full gap-[16px] px-[10px]">
		{Array.from({ length: 8 }).map((_, i) => (
			<CarGridCardSkeleton key={i} />
		))}
	</div>
);

export default CarGridSkeleton;
