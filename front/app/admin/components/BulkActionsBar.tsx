"use client";

import { useState, useEffect, useRef } from "react";
import { BiChevronDown, BiTrash } from "react-icons/bi";
import styles from "./inventoryPanel.module.css";
import barStyles from "./bulkActionsBar.module.css";

interface Props {
    count: number;
    deleting: boolean;
    onDelete: () => void;
    onClear: () => void;
}

const BulkActionsBar = ({ count, deleting, onDelete, onClear }: Props) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div className={barStyles.bar}>
            <span className={barStyles.count}>{count} selected</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div className={barStyles.dropdownWrap} ref={ref}>
                    <button
                        className={`${styles.btn} ${barStyles.actionsBtn}`}
                        onClick={() => setOpen((o) => !o)}
                        disabled={deleting}
                    >
                        Actions <BiChevronDown style={{ marginLeft: 4 }} />
                    </button>
                    {open && (
                        <div className={barStyles.dropdown}>
                            <button
                                className={barStyles.dropdownItem}
                                onClick={() => { setOpen(false); onDelete(); }}
                                disabled={deleting}
                            >
                                <BiTrash style={{ color: "#ef4444" }} />
                                Delete {count} item{count !== 1 ? "s" : ""}
                            </button>
                        </div>
                    )}
                </div>
                <button className={barStyles.clearBtn} onClick={onClear} disabled={deleting}>
                    Clear
                </button>
            </div>
        </div>
    );
};

export default BulkActionsBar;
