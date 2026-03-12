"use client";

import { useCartStore } from "@/stores/cartStore";
import { useState } from "react";
import { BsCart2 } from "react-icons/bs";
import TitleText from "../text/titleText";
import { BiTrash } from "react-icons/bi";

const CartButton = () => {
	const [cartMenuVisible, setCartMenuVisible] = useState<boolean>(false);

	const test: string[] = ["a", "a"];

	const { vins, removeVin } = useCartStore();
	const vinsCount: number = vins.length;
	return (
		<>
			{cartMenuVisible && (
				<div className="absolute top-[130%] right-[0px] border border-third w-[400px] z-[1] bg-primary pt-[10px] pb-[20px] px-[20px] rounded-md shadow-md text-foreground text-[16pt]">
					<TitleText className="mb-[10px]">Shopping Cart</TitleText>
					<p className="text-[12pt] font-[500]">
						{vinsCount} cars in your cart
					</p>
					{vinsCount > 0 && (
						<div className="w-full bg-third rounded-md px-[5px] py-[5px] flex flex-col gap-[5px]">
							{vins.map((vin: string) => (
								<div
									key={vin}
									className="w-full flex text-[14pt] justify-between items-center bg-primary-dark rounded-md py-[5px] pr-[5px] pl-[8px]"
								>
									<p>{vin}</p>
									<button
										onClick={() => {
											removeVin(vin);
										}}
										className="text-primary text-[14pt] p-[7px] bg-accent rounded-xl cursor-pointer"
									>
										<BiTrash />
									</button>
								</div>
							))}
						</div>
					)}
				</div>
			)}
			<div onClick={() => setCartMenuVisible(!cartMenuVisible)}>
				<BsCart2 />
				<div
					className={`absolute text-[8pt] font-[600] px-[8px] py-[2px] right-[28px] top-[-10px] bg-accent rounded-full text-primary ${vinsCount < 1 && "hidden"}`}
				>
					{vinsCount}
				</div>
			</div>
		</>
	);
};

export default CartButton;
