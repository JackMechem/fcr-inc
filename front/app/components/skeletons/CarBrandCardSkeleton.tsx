/** Skeleton for a single brand card (Porsche, BMW, etc.) on the home page. */
const CarBrandCardSkeleton = () => (
	<div className="flex flex-col gap-[40px] md:min-w-[500px] md:w-[500px] min-w-full bg-primary-dark rounded-lg px-[30px] py-[25px] shadow-md">
		<div className="h-[52px] w-full flex items-center justify-between">
			<div className="h-[40px] w-[40px] bg-third rounded animate-pulse" />
			<div className="h-[20px] w-[80px] bg-third rounded animate-pulse" />
		</div>
		<div className="h-[200px] w-full bg-third rounded animate-pulse" />
		<div className="flex justify-between items-center">
			<div className="flex flex-col gap-[6px]">
				<div className="h-[14px] w-[60px] bg-third rounded animate-pulse" />
				<div className="h-[28px] w-[100px] bg-third rounded animate-pulse" />
			</div>
			<div className="h-[36px] w-[120px] bg-third rounded-full animate-pulse" />
		</div>
	</div>
);

export default CarBrandCardSkeleton;
