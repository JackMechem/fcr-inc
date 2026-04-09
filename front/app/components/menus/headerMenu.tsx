"use client";

import Link from "next/link";

import { useCartStore } from "@/stores/cartStore";
import TitleText from "../text/titleText";
import { BiTrash } from "react-icons/bi";
import { CartProps } from "@/app/types/CartTypes";
import DefaultProfilePhoto from "../defaultProfilePhoto";
import Image from "next/image";
import { Ref } from "react";
import { PiEmpty } from "react-icons/pi";
import { BsCart, BsCartDash, BsCartX } from "react-icons/bs";

const HeaderMenu = ({ ref }: { ref: Ref<HTMLDivElement> }) => {
	const {
		carData,
		removeCar,
	}: { carData: CartProps[]; removeCar: (vin: string) => void } =
		useCartStore();
	const cartCount: number = carData.length;
	return (
		<div
			ref={ref}
			className="absolute z-[2] md:right-[20px] right-[10px] md:left-auto left-[10px] w-auto mx-0 top-[100%] mt-[10px] border border-third/80 bg-primary shadow-md text-foreground md:w-[400px] rounded-xl overflow-hidden"
		>
			<div className="flex w-full flex-col justify-center items-center bg-primary-dark py-[10px] px-[15px]">
				<div className="flex relative flex-col gap-[10px] items-center justify-center py-[15px] md:px-[40px] w-full">
					<div className="w-fit h-fit border-4 border-accent/70 bg-accent/10 p-[2px] rounded-full">
						<DefaultProfilePhoto totalHeight={60} headSize={20} />
					</div>
					<h2 className="font-titillium text-accent text-[18pt] text-center font-[500]">
						Guest
					</h2>
					<div className="flex w-full items-center gap-[10px]">
						<Link
							href={"/signup"}
							className="font-[500] text-[11pt] w-full text-center text-accent px-[12px] py-[6px] bg-primary rounded-full hover:bg-accent/90 hover:text-primary duration-[200ms]"
						>
							Signup
						</Link>
						<Link
							href={"/login"}
							className="font-[500] text-[11pt] w-full text-center text-accent px-[12px] py-[6px] bg-primary rounded-full hover:bg-accent/90 hover:text-primary duration-[200ms]"
						>
							Login
						</Link>
					</div>
				</div>
			</div>
			<div className="py-[15px] px-[15px] flex flex-col w-full">
				{cartCount > 0 ? (
					<div className="flex mb-[10px] font-[400] text-accent font-titillium gap-[10px] items-center">
						<BsCart />
						<h2 className="">
							Shopping Cart
						</h2>
					</div>
				) : (
					<div className="flex gap-[10px] items-center font-[400] text-accent font-titillium">
						<BsCartX /> No cars in cart
					</div>
				)}
				{cartCount > 0 && (
					<div className="w-full rounded-md px-[0px] py-[5px] flex flex-col gap-[5px] max-h-[300px] overflow-y-auto">
						{carData.map((car: CartProps) => (
							<div
								key={car.vin}
								className="w-full flex gap-[10px] text-[12pt] border border-third rounded-xl py-[0px] pr-[0px] group"
							>
								{car.image && (
									<Image
										src={car.image}
										alt="Car Photo"
										width={100}
										height={100}
										className="h-[80px] w-[80px] object-cover rounded-l-lg"
									/>
								)}
								<div className="flex flex-col h-fill w-full justify-between py-[5px]">
									<p className="text-foreground text-[12pt]">
										{car.make} {car.model}
									</p>
									<h3 className="text-accent text-[14pt]">
										${car.pricePerDay}
										<span className="opacity-[0.5] text-[10pt]">/day</span>
									</h3>
								</div>
								<button
									onClick={() => {
										removeCar(car.vin);
									}}
									className="hover:text-primary text-foreground-light text-[14pt] px-[10px] h-fill hover:bg-accent/70 rounded-r-xl cursor-pointer ml-auto duration-[200ms]"
								>
									<BiTrash />
								</button>
							</div>
						))}
					</div>
				)}
				{cartCount > 0 && (
					<>
						<Link
							href={"/cart"}
							className="w-full mt-[20px] flex items-center justify-center py-[9px] bg-accent/10 border-2 border-accent rounded-xl text-accent text-[12pt] font-[500] shadow-sm hover:bg-accent hover:text-primary cursor-pointer duration-[100ms]"
						>
							Go to cart
						</Link>
						<Link
							href={"/checkout"}
							className="w-full mt-[10px] flex items-center justify-center py-[9px] bg-accent rounded-xl text-primary text-[12pt] font-[500] shadow-sm hover:brightness-[110%] hover:scale-[101%] cursor-pointer duration-[100ms]"
						>
							Checkout
						</Link>
					</>
				)}
			</div>
			<Link
				href={"/admin"}
				className="absolute font-[500] text-[10pt] w-fit top-[5px] left-[10px] text-center text-accent"
			>
				Admin Dashboard
			</Link>
		</div>
	);
};

export default HeaderMenu;
