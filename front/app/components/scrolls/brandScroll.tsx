"use client";
import { ReactNode, useRef, useState } from "react";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";
const BrandScroll = ({ children }: { children: ReactNode }) => {
	const [controllerVisible, setControllerVisible] = useState<boolean>(false);
	const scrollRef = useRef<HTMLDivElement>(null);
	const scroll = (direction: number) => {
		if (scrollRef.current) {
			const firstChild = scrollRef.current
				.firstElementChild as HTMLElement | null;
			const scrollAmount = firstChild ? firstChild.offsetWidth + 15 : 300;
			scrollRef.current.scrollBy({
				left: direction * scrollAmount,
				behavior: "smooth",
			});
		}
	};
	return (
		<div
			ref={scrollRef}
			onMouseEnter={() => setControllerVisible(true)}
			onMouseLeave={() => setControllerVisible(false)}
			className="relative flex gap-[15px] p-[10px] w-full overflow-x-scroll"
		>
			{children}
			<div className="sticky float-right top-0 inset-0 right-0 w-0 h-0 pointer-events-none">
				<div
					className={`sticky mr-0 pointer-events-auto float-right mt-[10px] mr-[0px] w-fit h-fit duration-[200ms] text-[20px] text-secondary bg-primary shadow-md flex gap-[10px] p-[6px] rounded-full ${controllerVisible ? "opacity-[1]" : "sm:opacity-[0] opacity-[1]"} `}
				>
					<div
						onClick={() => scroll(-1)}
						className="w-[32px] h-[32px] flex items-center justify-center rounded-full hover:bg-third duration-[200ms] cursor-pointer"
					>
						<FaAngleLeft />
					</div>
					<div
						onClick={() => scroll(1)}
						className="w-[32px] h-[32px] flex items-center justify-center rounded-full hover:bg-third duration-[200ms] cursor-pointer"
					>
						<FaAngleRight />
					</div>
				</div>
			</div>
		</div>
	);
};
export default BrandScroll;
