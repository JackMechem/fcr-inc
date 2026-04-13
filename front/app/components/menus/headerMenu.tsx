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
import { IoClose } from "react-icons/io5";
import ThemeToggle from "../ThemeToggle";
import styles from "./headerMenu.module.css";

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
			<div className={`${styles.panel} ${isOpen ? styles.panelOpen : styles.panelClosed}`}>
				{/* Header */}
				<div className={styles.headerRow}>
					<button onClick={close} className={styles.closeBtn}>
						<IoClose />
					</button>
					<p className={styles.menuTitle}>Menu</p>
					<ThemeToggle />
				</div>

				{/* Profile section */}
				<div className={styles.profileRow}>
					<div className={styles.avatarBorder}>
						<DefaultProfilePhoto totalHeight={48} headSize={16} />
					</div>
					<div className={styles.profileInfo}>
						<p className={styles.profileName}>
							{isAdmin && username ? username : "Guest"}
						</p>
						<p className={styles.profileRole}>
							{isAdmin ? "Administrator" : "Not signed in"}
						</p>
					</div>
					{isAdmin ? (
						<button onClick={handleLogout} className={styles.signOutBtn}>
							Sign out
						</button>
					) : (
						<div className={styles.authBtns}>
							<Link href="/login" onClick={close} className={styles.loginBtn}>
								Login
							</Link>
							<Link href="/signup" onClick={close} className={styles.signupBtn}>
								Sign up
							</Link>
						</div>
					)}
				</div>

				{/* Cart section */}
				<div className={styles.cartSection}>
					<div className={styles.cartHeader}>
						<BsCart2 className={styles.cartIcon} />
						<p className={styles.cartTitle}>Cart</p>
						{cartCount > 0 && (
							<span className={styles.cartCount}>
								{cartCount} {cartCount === 1 ? "car" : "cars"}
							</span>
						)}
					</div>

					{cartCount === 0 ? (
						<div className={styles.emptyCart}>
							<BsCart3 className={styles.emptyCartIcon} />
							<p className={styles.emptyCartText}>Your cart is empty</p>
						</div>
					) : (
						<div className={styles.cartItems}>
							{carData.map((car: CartProps) => (
								<div key={car.vin} className={`card ${styles.cartItem}`}>
									{car.image && (
										<Image
											src={car.image}
											alt="Car Photo"
											width={124}
											height={124}
											className={styles.cartItemImage}
										/>
									)}
									<div className={styles.cartItemBody}>
										<div>
											<p className={styles.cartItemName}>
												{car.make} {car.model}
											</p>
											{car.startDate && car.endDate && (
												<p className={styles.cartItemDates}>
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
										<p className={styles.cartItemPrice}>
											${car.pricePerDay}
											<span className={styles.cartItemPriceUnit}>/day</span>
										</p>
									</div>
									<button
										onClick={() => removeCar(car.vin)}
										className={styles.cartItemRemove}
									>
										<BiTrash className={styles.cartItemRemoveIcon} />
									</button>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Footer */}
				<div className={styles.footer}>
					{cartCount > 0 && (
						<Link href="/checkout" onClick={close} className={styles.checkoutBtn}>
							Checkout
						</Link>
					)}
					<Link href="/reservations" onClick={close} className={styles.reservationsBtn}>
						My Reservations
					</Link>
					{isAdmin && (
						<Link href="/admin" onClick={close} className={styles.adminBtn}>
							Admin Dashboard
						</Link>
					)}
				</div>
			</div>
		</>
	);
};

export default HeaderMenu;
