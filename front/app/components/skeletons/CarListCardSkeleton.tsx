/** Skeleton for a single list-view car card on the browse page. */
const CarListCardSkeleton = () => (
	<div className="flex md:flex-row flex-col md:h-[300px] w-full gap-[10px]">
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

export default CarListCardSkeleton;
