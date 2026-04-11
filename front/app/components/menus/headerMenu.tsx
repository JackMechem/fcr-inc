"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useCartStore } from "@/stores/cartStore";
import { useSidebarStore } from "@/stores/sidebarStore";
import { validateCredentials } from "@/app/lib/AuthValidation";
import DefaultProfilePhoto from "../defaultProfilePhoto";
import Image from "next/image";
import { BiTrash, BiX } from "react-icons/bi";
import { CartProps } from "@/app/types/CartTypes";
import { BsCartX, BsCart } from "react-icons/bs";

const HeaderMenu = () => {
	const { openPanel, close } = useSidebarStore();
	const isOpen = openPanel === "menu";
	const { carData, removeCar }: { carData: CartProps[]; removeCar: (vin: string) => void } = useCartStore();
	const cartCount = carData.length;
	const router = useRouter();

	const [isAdmin, setIsAdmin] = useState(false);
	const [username, setUsername] = useState<string | null>(null);

	useEffect(() => {
		const raw = Cookies.get("credentials");
		if (!raw) return;
		const { username: u, password } = JSON.parse(raw);
		validateCredentials(u, password).then((status) => {
			if (status === 200) {
				setIsAdmin(true);
				setUsername(u);
			} else {
				setIsAdmin(false);
				setUsername(null);
			}
		});
	}, [isOpen]);

	const handleLogout = () => {
		Cookies.remove("credentials");
		setIsAdmin(false);
		setUsername(null);
		close();
	};

	return (
		<div
			className={`fixed top-0 right-0 h-full z-50 w-full md:w-[380px] bg-primary border-l border-third shadow-xl flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
		>
			{/* Close button */}
			<button
				onClick={close}
				className="absolute top-[14px] left-[14px] text-[18pt] text-foreground hover:text-accent transition-colors"
			>
				<BiX />
			</button>

			{/* Profile section */}
			<div className="flex flex-col items-center bg-primary-dark py-[20px] px-[15px] pt-[50px]">
				<div className="w-fit h-fit border-4 border-accent/70 bg-accent/10 p-[2px] rounded-full mb-[10px]">
					<DefaultProfilePhoto totalHeight={60} headSize={20} />
				</div>
				<h2 className="font-titillium text-accent text-[18pt] font-[500]">
					{isAdmin && username ? username : "Guest"}
				</h2>
				{isAdmin && (
					<p className="text-accent/60 text-[10pt] mb-[10px]">Admin</p>
				)}
				<div className={`flex w-full items-center gap-[10px] ${isAdmin ? "" : "mt-[10px]"}`}>
					{isAdmin ? (
						<button
							onClick={handleLogout}
							className="font-[500] text-[11pt] w-full text-center text-accent px-[12px] py-[6px] bg-primary rounded-full hover:bg-accent/90 hover:text-primary duration-[200ms]"
						>
							Logout
						</button>
					) : (
						<>
							<Link
								href={"/signup"}
								onClick={close}
								className="font-[500] text-[11pt] w-full text-center text-accent px-[12px] py-[6px] bg-primary rounded-full hover:bg-accent/90 hover:text-primary duration-[200ms]"
							>
								Signup
							</Link>
							<Link
								href={"/login"}
								onClick={close}
								className="font-[500] text-[11pt] w-full text-center text-accent px-[12px] py-[6px] bg-primary rounded-full hover:bg-accent/90 hover:text-primary duration-[200ms]"
							>
								Login
							</Link>
						</>
					)}
				</div>
			</div>

			{/* Cart section */}
			<div className="flex flex-col flex-1 overflow-y-auto py-[15px] px-[15px]">
				<div className="flex mb-[10px] font-[400] text-[16pt] text-accent font-titillium gap-[10px] items-center">
					{cartCount > 0 ? (
						<>
							<BsCart />
							<h2>Shopping Cart</h2>
						</>
					) : (
						<>
							<BsCartX />
							<span>No cars in cart</span>
						</>
					)}
				</div>

				{cartCount > 0 && (
					<div className="flex flex-col gap-[12px]">
						{carData.map((car: CartProps) => (
							<div key={car.vin} className="flex flex-col gap-[4px]">
								{car.startDate && car.endDate && (
									<p className="text-accent text-[11pt] font-[400] px-[2px]">
										{new Date(car.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
										{" – "}
										{new Date(car.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
									</p>
								)}
								<div className="w-full flex gap-[10px] text-[12pt] border border-third rounded-xl py-[0px] pr-[0px] group">
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
										onClick={() => removeCar(car.vin)}
										className="hover:text-primary text-foreground-light text-[14pt] px-[10px] h-fill hover:bg-accent/70 rounded-r-xl cursor-pointer ml-auto duration-[200ms]"
									>
										<BiTrash />
									</button>
								</div>
							</div>
						))}
					</div>
				)}

				{cartCount > 0 && (
					<div className="mt-[20px] flex flex-col gap-[10px]">
						<Link
							href={"/checkout"}
							onClick={close}
							className="w-full flex items-center justify-center py-[9px] bg-accent rounded-xl text-primary text-[12pt] font-[500] shadow-sm hover:brightness-[110%] hover:scale-[101%] cursor-pointer duration-[100ms]"
						>
							Checkout
						</Link>
					</div>
				)}
			</div>

			{/* Admin link */}
			{isAdmin && (
				<div className="px-[15px] py-[12px] border-t border-third">
					<Link
						href={"/admin"}
						onClick={close}
						className="font-[500] text-[10pt] text-accent hover:underline"
					>
						Admin Dashboard
					</Link>
				</div>
			)}
		</div>
	);
};

export default HeaderMenu;
