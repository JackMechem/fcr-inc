"use client";

import DatePicker from "@/app/components/DatePicker";
import { useHydrated } from "@/app/hooks/useHydrated";
import { CartProps } from "@/app/types/CartTypes";
import { Car } from "@/app/types/CarTypes";
import { useCartStore } from "@/stores/cartStore";
import { useState } from "react";

const carToCartProps = (car: Car, startDate?: Date, endDate?: Date): CartProps => ({
	vin: car.vin,
	make: car.make,
	model: car.model,
	pricePerDay: car.pricePerDay,
	image: car.images[0] ?? undefined,
	startDate: startDate?.toISOString(),
	endDate: endDate?.toISOString(),
});

const labelCls = "text-[8pt] font-[700] uppercase tracking-wider text-foreground-light mb-[6px] block";

const RightColumn = ({ carData }: { carData: Car }) => {
	const { addCar, removeCar, inCart } = useCartStore();
	const isInCart = inCart(carData.vin);
	const [startDate, setStartDate] = useState<Date | undefined>(undefined);
	const [endDate, setEndDate] = useState<Date | undefined>(undefined);
	const hydrated = useHydrated();

	const canAdd = isInCart || (!!startDate && !!endDate);

	if (!hydrated) return null;

	return (
		<div className="card flex flex-col gap-[16px] md:w-[380px] w-full flex-shrink-0 h-fit mt-[20px] p-[20px]">

			{/* Price */}
			<div>
				<p className="text-accent text-[24pt] font-[500] leading-none">
					${carData.pricePerDay}
					<span className="text-[14pt] font-[400] text-accent/70">/day</span>
				</p>
				<p className="text-foreground-light text-[10pt] mt-[4px]">Before taxes</p>
			</div>

			<div className="w-full h-[1px] bg-third/60" />

			{/* Date pickers */}
			<div className="flex flex-col gap-[12px]">
				<p className="text-foreground text-[11pt] font-[600]">Your Trip</p>
				<div className="grid grid-cols-2 gap-[10px]">
					<div>
						<label className={labelCls}>Trip Start</label>
						<div className="border border-third rounded-xl px-[12px] py-[10px] focus-within:border-accent/60 transition">
							<DatePicker
								label="Trip Start"
								showLabel={false}
								placeholder="Add date"
								selected={startDate}
								fromDate={new Date()}
								onSelect={(d) => {
									setStartDate(d);
									if (endDate && d && d > endDate) setEndDate(undefined);
								}}
							/>
						</div>
					</div>
					<div>
						<label className={labelCls}>Trip End</label>
						<div className="border border-third rounded-xl px-[12px] py-[10px] focus-within:border-accent/60 transition">
							<DatePicker
								label="Trip End"
								showLabel={false}
								placeholder="Add date"
								selected={endDate}
								onSelect={setEndDate}
								fromDate={startDate}
							/>
						</div>
					</div>
				</div>
			</div>

			<div className="w-full h-[1px] bg-third/60" />

			{/* Hint */}
			{!isInCart && (!startDate || !endDate) && (
				<p className="text-center text-[9.5pt] text-foreground-light/70">
					Select trip dates to add to cart
				</p>
			)}

			{/* CTA */}
			<button
				disabled={!canAdd}
				onClick={() =>
					isInCart
						? removeCar(carData.vin)
						: addCar(carToCartProps(carData, startDate, endDate))
				}
				className={`w-full py-[12px] rounded-xl font-[600] text-[11pt] transition duration-[100ms] cursor-pointer
					disabled:opacity-40 disabled:cursor-not-allowed
					${isInCart
						? "bg-third text-foreground hover:bg-accent/20 hover:text-accent/80 border border-third"
						: "bg-accent text-primary hover:brightness-110 hover:scale-[101%]"
					}`}
			>
				{isInCart ? "Remove from cart" : "Add to cart"}
			</button>
		</div>
	);
};

export default RightColumn;
