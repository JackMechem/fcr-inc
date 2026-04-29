"use client";

import { useState, useRef, useCallback, ReactNode } from "react";
import { useBrowsePreviewStore } from "@/stores/browsePreviewStore";
import BrowseCarPreviewPanel from "../preview/BrowseCarPreviewPanel";
import { BrowseScrollContext } from "./BrowseScrollContext";
import styles from "./browseContent.module.css";

const DEFAULT_PREVIEW_PCT = 42;
const MIN_PREVIEW_PCT = 20;
const MAX_PREVIEW_PCT = 70;

const BrowseTwoPaneLayout = ({ children, toolbar }: { children: ReactNode; toolbar?: ReactNode }) => {
    const previewOpen = useBrowsePreviewStore((s) => s.previewOpen);
    const [previewPct, setPreviewPct] = useState(DEFAULT_PREVIEW_PCT);
    const rowRef = useRef<HTMLDivElement>(null);
    const carListRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        const row = rowRef.current;
        if (!row) return;
        const rect = row.getBoundingClientRect();

        const onMove = (mv: MouseEvent) => {
            const fromRight = rect.right - mv.clientX;
            const pct = (fromRight / rect.width) * 100;
            setPreviewPct(Math.max(MIN_PREVIEW_PCT, Math.min(MAX_PREVIEW_PCT, pct)));
        };

        const onUp = () => {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        };

        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
    }, []);

    return (
        <div className={styles.browseRow} ref={rowRef}>
            <BrowseScrollContext.Provider value={carListRef}>
                <div
                    className={`${styles.carListPane} ${previewOpen ? styles.carListPaneCard : ""}`}
                    ref={carListRef}
                >
                    {toolbar && <div className={styles.paneToolbar}>{toolbar}</div>}
                    {children}
                </div>
            </BrowseScrollContext.Provider>
            {previewOpen && (
                <div className={styles.previewResizeHandle} onMouseDown={handleMouseDown} />
            )}
            <BrowseCarPreviewPanel width={previewOpen ? `${previewPct}%` : undefined} />
        </div>
    );
};

export default BrowseTwoPaneLayout;
