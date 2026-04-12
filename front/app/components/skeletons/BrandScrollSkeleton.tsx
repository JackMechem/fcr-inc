import CarBrandCardSkeleton from "./CarBrandCardSkeleton";

/** Skeleton for the entire brand scroll section on the home page. */
const BrandScrollSkeleton = () => (
	<div className="flex gap-[15px] p-[10px] w-full overflow-hidden">
		{Array.from({ length: 3 }).map((_, i) => (
			<CarBrandCardSkeleton key={i} />
		))}
	</div>
);

export default BrandScrollSkeleton;
