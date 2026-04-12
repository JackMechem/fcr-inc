/** Skeleton for the simple carousel CarCard used on the home page. */
const CarCardSkeleton = () => (
	<div className="sm:min-w-[250px] w-full rounded-lg overflow-hidden bg-primary shadow-md">
		<div className="w-full h-[200px] bg-third animate-pulse" />
		<div className="px-[20px] py-[15px] flex flex-col gap-[10px]">
			<div className="flex justify-between items-start">
				<div className="flex flex-col gap-[6px] flex-1">
					<div className="h-[20px] w-[70%] bg-third rounded animate-pulse" />
					<div className="h-[14px] w-[30%] bg-third rounded animate-pulse" />
				</div>
				<div className="w-[25px] h-[25px] bg-third rounded animate-pulse" />
			</div>
			<div className="flex justify-between items-center">
				<div className="h-[20px] w-[60px] bg-third rounded animate-pulse" />
				<div className="h-[30px] w-[80px] bg-third rounded-full animate-pulse" />
			</div>
		</div>
	</div>
);

export default CarCardSkeleton;
