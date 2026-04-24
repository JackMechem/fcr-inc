"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { BsGrid, BsList } from "react-icons/bs";
import styles from "./browseBar.module.css";

const LayoutToggle = () => {
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const router = useRouter();
	const isGrid = searchParams.get("layout") === "grid";

	const toggle = () => {
		const params = new URLSearchParams(searchParams.toString());
		if (isGrid) {
			params.delete("layout");
		} else {
			params.set("layout", "grid");
		}
		router.push(`${pathname}?${params.toString()}`);
	};

	return (
		<button
			onClick={toggle}
			className={styles.layoutToggleBtn}
			title={isGrid ? "Switch to list view" : "Switch to grid view"}
		>
			{isGrid ? <BsList /> : <BsGrid />}
		</button>
	);
};

export default LayoutToggle;
