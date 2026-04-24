"use client";

import { CartProps } from "@/app/types/CartTypes";
import { useCartStore } from "@/stores/cartStore";
import Image from "next/image";
import Link from "next/link";
import styles from "../cart.module.css";

const CartContents = () => {
	const { carData } = useCartStore();

	return (
		<div className={styles.cartList}>
			{carData.map((cart: CartProps) => {
				return (
					<div className={styles.cartItem} key={cart.vin}>
						<Image
							src={cart.image!}
							alt="car image"
							width={800}
							height={500}
							className={styles.cartItemImage}
							loading="lazy"
						/>
						<div className={styles.cartItemDateBadge}>
							September 10, 2026 - September 12, 2026
						</div>
						<div className={styles.cartItemFooter}>
							<h2 className={styles.cartItemTitle}>
								{cart.make}{" "}
								<span className={styles.cartItemModel}>{cart.model}</span>
							</h2>
						</div>
					</div>
				);
			})}
			<Link href="/checkout" className={styles.checkoutLink}>Checkout</Link>
		</div>
	);
};

export default CartContents;
