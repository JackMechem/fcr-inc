/** Skeleton for a single grid-view car card on the browse page. */
const CarGridCardSkeleton = () => (
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

export default CarGridCardSkeleton;
