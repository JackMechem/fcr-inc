"use client";

import TitleText from "@/app/components/text/titleText";
import { useHydrated } from "@/app/hooks/useHydrated";
import { CartProps } from "@/app/types/CartTypes";
import { Car } from "@/app/types/CarTypes";
import { useCartStore } from "@/stores/cartStore";
import { PropsWithChildren, useEffect, useState } from "react";

const carToCartProps = (car: Car): CartProps => {
	return {
		vin: car.vin,
		make: car.make,
		model: car.model,
		pricePerDay: car.pricePerDay,
		image: car.images[0] ? car.images[0] : undefined,
	};
};

interface RightColumnProps extends PropsWithChildren {
	carData: Car;
}

const RightColumn = ({ children, carData }: RightColumnProps) => {
	const { addCar, removeCar, inCart } = useCartStore();
	const isInCart = inCart(carData.vin);

    const hydrated = useHydrated();
    
	return hydrated && (
		<div className="flex flex-col gap-[15px] md:w-[500px] h-fit mt-[20px] bg-primary border-2 border-third p-[20px] rounded-xl shadow-md">
			<div>
				<TitleText>${carData.pricePerDay}/day</TitleText>
				<p className="text-foreground opacity-[0.7] text-[11pt]">
					Before taxes
				</p>
			</div>
			<div className="w-full h-[1px] bg-third" />
			<div>
				<h4 className="text-[14pt] font-[600] text-accent mb-[10px]">
					Your Trip
				</h4>
				<div className="mb-[10px]">
					<p className="text-[11pt] text-foreground opacity-[0.8] mb-[5px]">
						Trip Start
					</p>
					<div className="flex gap-[10px]">
						<input
							placeholder="Date"
							className="px-[10px] py-[8px] w-full border-2 border-third rounded-lg"
						/>
						<input
							placeholder="Time"
							className="px-[10px] py-[8px] w-full border-2 border-third rounded-lg"
						/>
					</div>
				</div>
				<div>
					<p className="text-[11pt] text-foreground opacity-[0.8] mb-[5px]">
						Trip End
					</p>
					<div className="flex gap-[10px]">
						<input
							placeholder="Date"
							className="px-[10px] py-[8px] w-full border-2 border-third rounded-lg"
						/>
						<input
							placeholder="Time"
							className="px-[10px] py-[8px] w-full border-2 border-third rounded-lg"
						/>
					</div>
				</div>
			</div>
			<div className="w-full h-[1px] bg-third" />
            
			<button
				onClick={() => (isInCart ? removeCar(carData.vin) : addCar(carToCartProps(carData)))}
				className="w-full flex items-center justify-center py-[10px] bg-accent rounded-xl text-primary font-[500] shadow-sm hover:brightness-[110%] hover:scale-[101%] cursor-pointer duration-[100ms]"
			>
                {!isInCart ? "Add to cart" : "Remove from cart"}
			</button>
		</div>
	);
};

export default RightColumn;
