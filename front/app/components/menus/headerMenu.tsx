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
import { BiTrash } from "react-icons/bi";
import { CartProps } from "@/app/types/CartTypes";
import { BsCart2, BsCart3 } from "react-icons/bs";
import { HiOutlineShoppingCart } from "react-icons/hi";
import { IoClose } from "react-icons/io5";
import { FaShoppingCart } from "react-icons/fa";
import { RiShoppingCart2Line } from "react-icons/ri";

const HeaderMenu = () => {
	const { openPanel, close } = useSidebarStore();
	const isOpen = openPanel === "menu";
	const {
		carData,
		removeCar,
	}: { carData: CartProps[]; removeCar: (vin: string) => void } =
		useCartStore();
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
		<>
			{/* Panel */}
			<div
				className={`fixed top-0 right-0 h-full z-50 w-full md:w-[380px] md:border-l md:border-third bg-primary flex flex-col overflow-y-auto transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
			>
				{/* Header */}
				<div className="flex items-center justify-between px-[20px] py-[20px] border-b border-third/50">
					<button
						onClick={close}
						className="text-[18pt] text-foreground-light hover:text-foreground transition-colors cursor-pointer"
					>
						<IoClose />
					</button>
					<p className="text-[12pt] font-[600] text-foreground mr-auto ml-auto">Menu</p>
				</div>

				{/* Profile section */}
				<div className="flex items-center gap-[14px] px-[20px] py-[20px] border-b border-third/50">
					<div className="border-2 border-accent/30 rounded-full p-[2px]">
						<DefaultProfilePhoto totalHeight={48} headSize={16} />
					</div>
					<div className="flex-1 min-w-0">
						<p className="text-foreground font-[600] text-[12pt] truncate">
							{isAdmin && username ? username : "Guest"}
						</p>
						<p className="text-foreground-light text-[9pt]">
							{isAdmin ? "Administrator" : "Not signed in"}
						</p>
					</div>
					{isAdmin ? (
						<button
							onClick={handleLogout}
							className="text-[9.5pt] font-[500] text-foreground-light hover:text-accent transition-colors cursor-pointer"
						>
							Sign out
						</button>
					) : (
						<div className="flex gap-[8px]">
							<Link
								href="/login"
								onClick={close}
								className="text-[9.5pt] font-[500] px-[12px] py-[6px] rounded-lg border border-third hover:border-accent/40 hover:text-accent text-foreground transition-colors"
							>
								Login
							</Link>
							<Link
								href="/signup"
								onClick={close}
								className="text-[9.5pt] font-[500] px-[12px] py-[6px] rounded-lg bg-accent text-primary hover:brightness-110 transition-all"
							>
								Sign up
							</Link>
						</div>
					)}
				</div>

				{/* Cart section */}
				<div className="flex flex-col overflow-y-auto px-[20px] py-[20px] gap-[16px]">
					<div className="flex items-center gap-[8px] text-foreground">
						<BsCart2 className="text-[18pt] text-foreground" />
						<p className="text-[14pt] font-[500] text-foreground">
							Cart
						</p>
						{cartCount > 0 && (
							<span className="ml-auto text-[9pt] font-[500] text-foreground-light">
								{cartCount} {cartCount === 1 ? "car" : "cars"}
							</span>
						)}
					</div>

					{cartCount === 0 ? (
						<div className="flex flex-col items-center justify-center gap-[8px] py-[40px] text-foreground-light/40">
							<BsCart3 className="text-[32pt]" />
							<p className="text-[10pt]">Your cart is empty</p>
						</div>
					) : (
						<div className="flex flex-col gap-[10px]">
							{carData.map((car: CartProps) => (
								<div
									key={car.vin}
									className="card flex gap-[0px] overflow-hidden"
								>
									{car.image && (
										<Image
											src={car.image}
											alt="Car Photo"
											width={124}
											height={124}
											className="h-[90px] w-[90px] object-cover flex-shrink-0"
										/>
									)}
									<div className="flex flex-col justify-between flex-1 min-w-0 px-[12px] py-[10px]">
										<div>
											<p className="text-foreground text-[10.5pt] font-[500] truncate">
												{car.make} {car.model}
											</p>
											{car.startDate && car.endDate && (
												<p className="text-foreground-light text-[8.5pt] mt-[2px]">
													{new Date(car.startDate).toLocaleDateString("en-US", {
														month: "short",
														day: "numeric",
													})}
													{" – "}
													{new Date(car.endDate).toLocaleDateString("en-US", {
														month: "short",
														day: "numeric",
														year: "numeric",
													})}
												</p>
											)}
										</div>
										<p className="text-accent text-[12pt] font-[500]">
											${car.pricePerDay}
											<span className="text-[9pt] text-accent/60 font-[400]">
												/day
											</span>
										</p>
									</div>
									<button
										onClick={() => removeCar(car.vin)}
										className="px-[12px] text-foreground-light/50 hover:text-accent hover:bg-accent/5 transition-colors cursor-pointer flex-shrink-0"
									>
										<BiTrash className="text-[14pt]" />
									</button>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="px-[20px] py-[16px] border-t border-third/50 flex flex-col gap-[10px]">
					{cartCount > 0 && (
						<Link
							href="/checkout"
							onClick={close}
							className="w-full text-center py-[10px] bg-accent text-primary text-[11pt] font-[600] rounded-xl hover:brightness-110 hover:scale-[101%] transition-all duration-100 cursor-pointer"
						>
							Checkout
						</Link>
					)}
					{isAdmin && (
						<Link
							href="/admin"
							onClick={close}
							className="w-full text-center py-[9px] border border-third rounded-xl text-foreground text-[10.5pt] font-[500] hover:border-accent/40 hover:text-accent transition-colors"
						>
							Admin Dashboard
						</Link>
					)}
				</div>
			</div>
		</>
	);
};

export default HeaderMenu;
