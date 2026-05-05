"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { BiDownload } from "react-icons/bi";
import styles from "./spreadsheetTable.module.css";

export interface ExportOption {
    label: string;
    sub?: string;
    icon: React.ReactNode;
    onClick: () => void | Promise<void>;
    disabled?: boolean;
    divider?: boolean;
    section?: string;
}

interface ExportButtonProps {
    options: ExportOption[];
    disabled?: boolean;
    btnClassName: string;
}

export default function ExportButton({ options, disabled, btnClassName }: ExportButtonProps) {
    const [open, setOpen]   = useState(false);
    const [pos,  setPos]    = useState({ top: 0, right: 0 });
    const btnRef            = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            const menu = document.querySelector("[data-export-menu]");
            if (!menu?.contains(e.target as Node) && !btnRef.current?.contains(e.target as Node))
                setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const toggle = () => {
        if (!btnRef.current) return;
        const rect = btnRef.current.getBoundingClientRect();
        setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
        setOpen((o) => !o);
    };

    return (
        <>
            <button
                ref={btnRef}
                className={btnClassName}
                onClick={toggle}
                disabled={disabled}
                title="Export"
            >
                <BiDownload />
            </button>

            {open && typeof document !== "undefined" && createPortal(
                <div
                    data-export-menu="true"
                    className={styles.contextMenu}
                    style={{ top: pos.top, right: pos.right, minWidth: 168 }}
                >
                    {options.map((opt, i) => (
                        <div key={i}>
                            {opt.divider  && <div className={styles.ctxDivider} />}
                            {opt.section  && <p   className={styles.ctxSection}>{opt.section}</p>}
                            <button
                                className={styles.ctxItem}
                                disabled={opt.disabled}
                                onClick={async () => { await opt.onClick(); setOpen(false); }}
                            >
                                {opt.icon}
                                {opt.label}
                            </button>
                        </div>
                    ))}
                </div>,
                document.body
            )}
        </>
    );
}
