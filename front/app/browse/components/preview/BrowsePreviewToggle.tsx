"use client";

import { useBrowsePreviewStore } from "@/stores/browsePreviewStore";
import { BiDockRight } from "react-icons/bi";
import styles from "../filters/browseBar.module.css";

const BrowsePreviewToggle = () => {
    const { previewOpen, setPreviewOpen } = useBrowsePreviewStore();

    return (
        <button
            onClick={() => setPreviewOpen(!previewOpen)}
            className={styles.layoutToggleBtn}
            title={previewOpen ? "Close preview panel" : "Open preview panel"}
            style={previewOpen ? { borderColor: "var(--color-accent)", color: "var(--color-accent)" } : undefined}
        >
            <BiDockRight />
        </button>
    );
};

export default BrowsePreviewToggle;
