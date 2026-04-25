"use client";

import { useRouter } from "next/navigation";
import { useUserDashboardStore, Session } from "@/stores/userDashboardStore";
import { BiPlus, BiX } from "react-icons/bi";
import styles from "./sessionSwitcher.module.css";

const ROLE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
    ADMIN: { bg: "rgba(239,68,68,0.15)",   border: "rgba(239,68,68,0.5)",   text: "#ef4444" },
    STAFF: { bg: "rgba(59,130,246,0.15)",  border: "rgba(59,130,246,0.5)",  text: "#3b82f6" },
};
const DEFAULT_COLOR = { bg: "var(--color-third)", border: "var(--color-border)", text: "var(--color-foreground-light)" };

function sessionLabel(s: Session) {
    return s.userName || s.userEmail || `#${s.accountId}`;
}

export default function SessionSwitcher() {
    const { sessions, activeSessionIndex, switchSession, removeSession } = useUserDashboardStore();
    const router = useRouter();

    if (sessions.length === 0) return null;

    const handleAddAccount = () => {
        sessionStorage.setItem("add-account", "1");
        router.push("/login");
    };

    return (
        <div className={styles.wrapper}>
            {sessions.map((s, i) => {
                const active = i === activeSessionIndex;
                const color = ROLE_COLORS[s.role] ?? DEFAULT_COLOR;
                return (
                    <div
                        key={s.accountId}
                        className={`${styles.pill} ${active ? styles.pillActive : ""}`}
                        style={active ? { background: color.bg, borderColor: color.border, color: color.text } : undefined}
                        onClick={() => !active && switchSession(i)}
                        title={active ? `Active: ${sessionLabel(s)} (${s.role})` : `Switch to ${sessionLabel(s)} (${s.role})`}
                    >
                        <span className={styles.pillDot} style={{ background: color.text }} />
                        <span className={styles.pillLabel}>{sessionLabel(s)}</span>
                        <span className={styles.pillRole}>{s.role}</span>
                        {sessions.length > 1 && (
                            <button
                                className={styles.pillRemove}
                                onClick={(e) => { e.stopPropagation(); removeSession(i); }}
                                title="Remove session"
                            >
                                <BiX />
                            </button>
                        )}
                    </div>
                );
            })}
            <button className={styles.addBtn} onClick={handleAddAccount} title="Add account">
                <BiPlus />
            </button>
        </div>
    );
}
