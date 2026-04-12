import CarCardSkeleton from "./CarCardSkeleton";

/** Skeleton for the full horizontal car carousel on the home page. */
const CarScrollSkeleton = () => (
	<div className="w-full grid 2xl:grid-cols-5 xl:grid-cols-4 lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-x-[10px] gap-y-[20px] px-[10px] py-[10px]">
		{Array.from({ length: 5 }).map((_, i) => (
			<CarCardSkeleton key={i} />
		))}
	</div>
);

export default CarScrollSkeleton;
