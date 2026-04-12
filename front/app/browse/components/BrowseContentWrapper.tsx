"use client";

import { useSidebarStore } from "@/stores/sidebarStore";
import { ReactNode } from "react";

const BrowseContentWrapper = ({ children }: { children: ReactNode }) => {
	const openPanel = useSidebarStore((s) => s.openPanel);
	const isOpen = openPanel !== null;

	return (
		<div
			className={`pt-[15px] pb-[50px] w-full bg-primary transition-[padding] duration-200 ${
				isOpen ? "px-[20px]" : "2xl:px-[200px] lg:px-[50px] px-[20px]"
			}`}
		>
			{children}
		</div>
	);
};

export default BrowseContentWrapper;
