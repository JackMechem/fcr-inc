"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSidebarStore } from "@/stores/sidebarStore";
import { useDevConsoleStore, RequestLog } from "@/stores/devConsoleStore";
import { IoClose } from "react-icons/io5";
import { BiTrash, BiChevronDown, BiChevronRight } from "react-icons/bi";
import styles from "./devConsole.module.css";

const METHOD_COLORS: Record<string, string> = {
    GET: "#22c55e",
    POST: "#3b82f6",
    PUT: "#f59e0b",
    PATCH: "#f59e0b",
    DELETE: "#ef4444",
};

function formatTime(date: Date) {
    return date.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

function StatusBadge({ status }: { status: number | null }) {
    const color =
        status === null
            ? "#6b7280"
            : status < 300
                ? "#22c55e"
                : status < 400
                    ? "#f59e0b"
                    : "#ef4444";
    return (
        <span className={styles.statusBadge} style={{ color }}>
            {status ?? "ERR"}
        </span>
    );
}

function LogEntry({ log }: { log: RequestLog }) {
    const [expanded, setExpanded] = useState(false);
    const methodColor = METHOD_COLORS[log.method] ?? "#a855f7";

    return (
        <div className={styles.logEntry}>
            <button
                className={styles.logSummary}
                onClick={() => setExpanded((v) => !v)}
            >
                <span className={styles.expandIcon}>
                    {expanded ? <BiChevronDown /> : <BiChevronRight />}
                </span>
                <span
                    className={styles.methodBadge}
                    style={{ background: `${methodColor}22`, color: methodColor }}
                >
                    {log.method}
                </span>
                <StatusBadge status={log.status} />
                <span className={styles.logUrlGroup}>
                    <span className={styles.logUrl}>{log.url}</span>
                    <span className={styles.logBackendUrl}>{log.backendUrl}</span>
                </span>
                <span className={styles.logMeta}>
                    {log.duration != null ? `${log.duration}ms` : ""}
                </span>
                <span className={styles.logTime}>{formatTime(log.timestamp)}</span>
            </button>

            {expanded && (
                <div className={styles.logDetail}>
                    {log.error && (
                        <div className={styles.detailBlock}>
                            <p className={styles.detailLabel}>Error</p>
                            <pre className={`${styles.detailPre} ${styles.detailError}`}>
                                {log.error}
                            </pre>
                        </div>
                    )}
                    {log.requestBody !== undefined && (
                        <div className={styles.detailBlock}>
                            <p className={styles.detailLabel}>Request Body</p>
                            <pre className={styles.detailPre}>
                                {JSON.stringify(log.requestBody, null, 2)}
                            </pre>
                        </div>
                    )}
                    <div className={styles.detailBlock}>
                        <p className={styles.detailLabel}>Response</p>
                        <pre className={styles.detailPre}>
                            {log.responseBody !== null && log.responseBody !== undefined
                                ? JSON.stringify(log.responseBody, null, 2)
                                : "(empty)"}
                        </pre>
                    </div>
                    <div className={styles.detailBlock}>
                        <p className={styles.detailLabel}>Next.js Route</p>
                        <pre className={styles.detailPre}>{log.url}</pre>
                    </div>
                    <div className={styles.detailBlock}>
                        <p className={styles.detailLabel}>Backend URL</p>
                        <pre className={styles.detailPre}>{log.backendUrl}</pre>
                    </div>
                </div>
            )}
        </div>
    );
}

const MIN_WIDTH = 320;
const MAX_WIDTH_OFFSET = 80; // keep at least 80px of page visible

const DevConsole = () => {
    const { openPanel, close } = useSidebarStore();
    const isOpen = openPanel === "devConsole";
    const { logs, clearLogs, panelWidth, setPanelWidth } = useDevConsoleStore();

    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const isDragging = useRef(false);
    const startX = useRef(0);
    const startWidth = useRef(panelWidth);

    const onMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging.current) return;
        const delta = startX.current - e.clientX;
        const maxWidth = window.innerWidth - MAX_WIDTH_OFFSET;
        const next = Math.min(maxWidth, Math.max(MIN_WIDTH, startWidth.current + delta));
        setPanelWidth(next);
    }, [setPanelWidth]);

    const onMouseUp = useCallback(() => {
        if (!isDragging.current) return;
        isDragging.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
    }, [onMouseMove]);

    const onHandleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isDragging.current = true;
        startX.current = e.clientX;
        startWidth.current = panelWidth;
        document.body.style.cursor = "ew-resize";
        document.body.style.userSelect = "none";
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    }, [panelWidth, onMouseMove, onMouseUp]);

    // Clean up listeners if component unmounts mid-drag
    useEffect(() => {
        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };
    }, [onMouseMove, onMouseUp]);

    return (
        <div
            className={`${styles.panel} ${isOpen ? styles.panelOpen : styles.panelClosed}`}
            style={mounted && window.innerWidth >= 768 ? { width: panelWidth } : undefined}
        >
            {/* Resize handle */}
            <div
                className={styles.resizeHandle}
                onMouseDown={onHandleMouseDown}
                title="Drag to resize"
            >
                <div className={styles.resizeGrip} />
            </div>

            {/* Header */}
            <div className={styles.headerRow}>
                <button onClick={close} className={styles.closeBtn}>
                    <IoClose />
                </button>
                <p className={styles.title}>Dev Console</p>
                <button
                    onClick={clearLogs}
                    className={styles.clearBtn}
                    title="Clear all logs"
                >
                    <BiTrash />
                </button>
            </div>

            {/* Stats bar */}
            <div className={styles.statsBar}>
                <span className={styles.statItem}>
                    <span className={styles.statDot} style={{ background: "#22c55e" }} />
                    {logs.filter((l) => l.status !== null && l.status < 300).length} ok
                </span>
                <span className={styles.statItem}>
                    <span className={styles.statDot} style={{ background: "#ef4444" }} />
                    {logs.filter((l) => l.status === null || l.status >= 400).length} err
                </span>
                <span className={styles.statCount}>{logs.length} total</span>
            </div>

            {/* Log list */}
            <div className={styles.logList}>
                {logs.length === 0 ? (
                    <div className={styles.empty}>
                        <p className={styles.emptyText}>No requests logged yet.</p>
                        <p className={styles.emptyHint}>
                            API calls will appear here as you use the app.
                        </p>
                    </div>
                ) : (
                    logs.map((log) => <LogEntry key={log.id} log={log} />)
                )}
            </div>
        </div>
    );
};

export default DevConsole;
