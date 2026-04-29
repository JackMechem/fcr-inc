"use client";

import { useSidebarStore } from "@/stores/sidebarStore";
import { useBrowsePreviewStore } from "@/stores/browsePreviewStore";
import { ReactNode } from "react";
import styles from "./browseContent.module.css";

const BrowseContentWrapper = ({ children }: { children: ReactNode }) => {
	const openPanel = useSidebarStore((s) => s.openPanel);
	const previewOpen = useBrowsePreviewStore((s) => s.previewOpen);
	const isSidebarOpen = openPanel !== null;

	// Only add centering side-padding when the filter sidebar is closed AND the preview panel is not open.
	// When the preview panel is open the car list pane is already narrow — the large padding would crush it.
	const centered = !isSidebarOpen && !previewOpen;

	return (
		<div className={`${styles.contentWrapper} ${centered ? styles.contentWrapperClosed : ""}`}>
			{children}
		</div>
	);
};

export default BrowseContentWrapper;
