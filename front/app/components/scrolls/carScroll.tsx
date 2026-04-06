"use client";
import { Car } from "@/app/types/CarTypes";
import CarCard from "../cards/carCard";
import { useRef, useState } from "react";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";
interface CarScrollProps {
	cars: Car[];
}
const CarScroll = ({ cars }: CarScrollProps) => {
	const [controllerVisible, setControllerVisible] = useState<boolean>(false);
	const scrollRef = useRef<HTMLDivElement>(null);
	const scroll = (direction: number) => {
		if (scrollRef.current) {
			const firstChild = scrollRef.current.firstElementChild as HTMLElement | null;
			const scrollAmount = firstChild ? firstChild.offsetWidth + 20 : 300;
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
			className="w-full h-fit flex flex-wrap justify-start gap-[20px] px-[10px] py-[10px]"
		>
			{cars.map((car: Car) => (
				<CarCard key={car.vin} car={car} />
			))}
		</div>
	);
};
export default CarScroll;
