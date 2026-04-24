"use client";

import { useSidebarStore } from "@/stores/sidebarStore";
import { ReactNode } from "react";
import styles from "./browseContent.module.css";

const BrowseContentWrapper = ({ children }: { children: ReactNode }) => {
	const openPanel = useSidebarStore((s) => s.openPanel);
	const isOpen = openPanel !== null;

	return (
		<div className={`${styles.contentWrapper} ${isOpen ? "" : styles.contentWrapperClosed}`}>
			{children}
		</div>
	);
};

export default BrowseContentWrapper;
