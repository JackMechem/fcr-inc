"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTableConfigStore, RolePerms, FullTableConfig } from "@/app/admin/config/tableConfigStore";
import { BiRefresh, BiLock, BiLockOpen, BiCheck, BiX } from "react-icons/bi";
import tableStyles from "@/app/admin/components/table/spreadsheetTable.module.css";

// ── Static metadata ───────────────────────────────────────────────────────────

const TABLE_KEYS = ["cars", "accounts", "users", "reservations", "reviews", "payments"] as const;
type TableKey = typeof TABLE_KEYS[number];

const TABLE_LABELS: Record<TableKey, string> = {
    cars: "Cars",
    accounts: "Accounts",
    users: "Users",
    reservations: "Reservations",
    reviews: "Reviews",
    payments: "Payments",
};

const TABLE_COLUMNS: Record<TableKey, string[]> = {
    cars: ["vin", "make", "model", "modelYear", "vehicleClass", "carStatus", "pricePerDay", "bodyType", "transmission", "drivetrain", "engineLayout", "fuel", "roofType", "cylinders", "gears", "horsepower", "torque", "seats", "mpg", "features", "images", "description"],
    accounts: ["acctId", "name", "email", "role", "dateCreated", "dateEmailConfirmed", "user", "bookmarkedCars"],
    users: ["userId", "firstName", "lastName", "email", "phoneNumber", "dateCreated", "address", "dlNumber", "dlState", "dlExpires", "dob", "reservations", "reviews"],
    reservations: ["reservationId", "car", "userId", "pickUpTime", "dropOffTime", "durationDays", "dateBooked", "payments"],
    reviews: ["reviewId", "account", "car", "stars", "title", "bodyOfText", "rentalDuration", "publishedDate"],
    payments: ["paymentId", "paymentType", "totalAmount", "amountPaid", "paid", "date", "reservationId"],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function deepEqual(a: unknown, b: unknown): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
}

function cloneConfig(cfg: FullTableConfig): FullTableConfig {
    return JSON.parse(JSON.stringify(cfg));
}

// ── Toggle switch ─────────────────────────────────────────────────────────────

const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button
        onClick={() => onChange(!value)}
        style={{
            width: 36, height: 20, borderRadius: 10,
            background: value ? "var(--color-accent)" : "var(--color-third)",
            border: "none", cursor: "pointer", position: "relative",
            transition: "background 150ms", flexShrink: 0,
        }}
    >
        <span style={{
            position: "absolute", top: 2,
            left: value ? 18 : 2,
            width: 16, height: 16, borderRadius: "50%",
            background: "#fff",
            transition: "left 150ms",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }} />
    </button>
);

// ── Column picker ─────────────────────────────────────────────────────────────

const ColPicker = ({
    label, icon, cols, selected: selectedRaw, onChange,
}: {
    label: string;
    icon: React.ReactNode;
    cols: string[];
    selected: string[] | null | undefined;
    onChange: (next: string[]) => void;
}) => {
    const selected = selectedRaw ?? [];
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0, visibility: "hidden" as "hidden" | "visible" });
    const btnRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (menuRef.current?.contains(e.target as Node) || btnRef.current?.contains(e.target as Node)) return;
            setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    // After portal renders, measure actual menu size and clamp to viewport
    useLayoutEffect(() => {
        if (!open || !menuRef.current || !btnRef.current) return;
        const menu = menuRef.current.getBoundingClientRect();
        const btn = btnRef.current.getBoundingClientRect();
        const pad = 8;
        let top = btn.bottom + 4;
        let left = btn.left;
        // Clamp right edge
        if (left + menu.width > window.innerWidth - pad) {
            left = window.innerWidth - menu.width - pad;
        }
        // Clamp left edge
        if (left < pad) left = pad;
        // Flip above button if overflows bottom
        if (top + menu.height > window.innerHeight - pad) {
            top = btn.top - menu.height - 4;
        }
        setPos({ top, left, visibility: "visible" });
    }, [open]);

    const handleOpen = () => {
        if (!btnRef.current) return;
        const r = btnRef.current.getBoundingClientRect();
        // Start hidden at approximate position; useLayoutEffect will correct it
        setPos({ top: r.bottom + 4, left: r.left, visibility: "hidden" });
        setOpen((o) => !o);
    };

    const toggle = (col: string) => {
        if (selected.includes(col)) onChange(selected.filter((c) => c !== col));
        else onChange([...selected, col]);
    };

    const MAX_CHIPS = 4;
    const visibleChips = selected.slice(0, MAX_CHIPS);
    const overflow = selected.length - MAX_CHIPS;

    return (
        <>
            <button
                ref={btnRef}
                onClick={handleOpen}
                style={{
                    display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
                    background: open ? "color-mix(in srgb, var(--color-third) 80%, transparent)" : "var(--color-primary)",
                    border: `1px solid ${open ? "color-mix(in srgb, var(--color-accent) 40%, var(--color-third))" : "var(--color-third)"}`,
                    borderRadius: 8, padding: "6px 10px", cursor: "pointer",
                    textAlign: "left", transition: "border-color 120ms, background 120ms",
                    minWidth: 160,
                }}
            >
                {/* Label */}
                <span style={{
                    display: "flex", alignItems: "center", gap: 5, flexShrink: 0,
                    fontSize: 10, fontWeight: 600, textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "var(--color-foreground-light)",
                }}>
                    {icon} {label}
                </span>

                {/* Chips or empty state */}
                {selected.length === 0 ? (
                    <span style={{ fontSize: 11, color: "color-mix(in srgb, var(--color-foreground-light) 50%, transparent)", fontStyle: "italic" }}>
                        none
                    </span>
                ) : (
                    <span style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                        {visibleChips.map((col) => (
                            <span key={col} style={{
                                fontSize: 10, fontWeight: 500,
                                padding: "2px 7px", borderRadius: 5,
                                background: "color-mix(in srgb, var(--color-accent) 12%, transparent)",
                                color: "var(--color-accent)",
                                border: "1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)",
                            }}>
                                {col}
                            </span>
                        ))}
                        {overflow > 0 && (
                            <span style={{
                                fontSize: 10, fontWeight: 600,
                                padding: "2px 7px", borderRadius: 5,
                                background: "var(--color-third)",
                                color: "var(--color-foreground-light)",
                            }}>
                                +{overflow}
                            </span>
                        )}
                    </span>
                )}
            </button>
            {open && createPortal(
                <div
                    ref={menuRef}
                    className={tableStyles.contextMenu}
                    style={{ top: pos.top, left: pos.left, minWidth: 180, maxHeight: 360, overflowY: "auto", visibility: pos.visibility }}
                >
                    <div className={tableStyles.ctxSection}>{label}</div>
                    {cols.map((col) => {
                        const checked = selected.includes(col);
                        return (
                            <div key={col} className={tableStyles.colMenuRow}>
                                <label className={tableStyles.colMenuLabel} style={{ paddingLeft: 12, gap: 10 }}>
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => toggle(col)}
                                        style={{ accentColor: "var(--color-accent)", cursor: "pointer", flexShrink: 0 }}
                                    />
                                    {col}
                                </label>
                            </div>
                        );
                    })}
                </div>,
                document.body
            )}
        </>
    );
};

// ── Role row ──────────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
    admin: { bg: "rgba(239,68,68,0.10)", color: "#ef4444" },
    staff: { bg: "rgba(59,130,246,0.10)", color: "#3b82f6" },
};

interface RoleRowProps {
    table: TableKey;
    roleKey: "admin" | "staff";
    perms: RolePerms;
    dirty: boolean;
    onUpdate: (patch: Partial<RolePerms>) => void;
}

const RoleRow = ({ table, roleKey, perms, dirty, onUpdate }: RoleRowProps) => {
    const cols = TABLE_COLUMNS[table];
    const { bg, color } = ROLE_COLORS[roleKey];
    return (
        <div style={{
            display: "flex", flexDirection: "column", gap: 10,
            padding: "12px 16px",
            borderTop: "1px solid color-mix(in srgb, var(--color-third) 60%, transparent)",
            background: dirty ? "color-mix(in srgb, var(--color-accent) 3%, transparent)" : undefined,
            transition: "background 200ms",
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <span style={{
                    fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                    letterSpacing: "0.06em", padding: "2px 8px", borderRadius: 6,
                    background: bg, color, flexShrink: 0, width: 52, textAlign: "center",
                }}>
                    {roleKey}
                </span>

                {(["canEdit", "canDelete", "canAddRow"] as const).map((key) => (
                    <label key={key} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                        <Toggle value={perms[key]} onChange={(v) => onUpdate({ [key]: v })} />
                        <span style={{ fontSize: 12, color: "var(--color-foreground-light)" }}>
                            {key === "canEdit" ? "Edit" : key === "canDelete" ? "Delete" : "Add Row"}
                        </span>
                    </label>
                ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <ColPicker
                    label="Locked Cols"
                    icon={<BiLockOpen style={{ fontSize: 12 }} />}
                    cols={cols}
                    selected={perms.lockedCols ?? []}
                    onChange={(v) => onUpdate({ lockedCols: v })}
                />
                <ColPicker
                    label="Perm. Locked"
                    icon={<BiLock style={{ fontSize: 12 }} />}
                    cols={cols}
                    selected={perms.permanentlyLockedCols ?? []}
                    onChange={(v) => onUpdate({ permanentlyLockedCols: v })}
                />
            </div>
        </div>
    );
};

// ── Table card ────────────────────────────────────────────────────────────────

interface TableCardProps {
    tableKey: TableKey;
    roleFilter: "admin" | "staff";
    draft: FullTableConfig;
    saved: FullTableConfig;
    onUpdate: (roleKey: "admin" | "staff", patch: Partial<RolePerms>) => void;
}

const TableCard = ({ tableKey, roleFilter, draft, saved, onUpdate }: TableCardProps) => {
    const entry = draft[tableKey];
    const savedEntry = saved[tableKey];
    if (!entry) return null;

    const adminDirty = !deepEqual(entry.admin, savedEntry?.admin);
    const staffDirty = !deepEqual(entry.staff, savedEntry?.staff);
    const anyDirty = (roleFilter === "admin" ? adminDirty : staffDirty);

    return (
        <div style={{
            borderRadius: 10,
            border: `1px solid ${anyDirty ? "color-mix(in srgb, var(--color-accent) 40%, var(--color-third))" : "var(--color-third)"}`,
            background: "var(--color-primary)", overflow: "hidden",
            transition: "border-color 200ms",
        }}>
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 16px",
                background: "color-mix(in srgb, var(--color-third) 30%, transparent)",
            }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: "var(--color-foreground)" }}>
                    {TABLE_LABELS[tableKey]}
                </span>
                {anyDirty && (
                    <span style={{ fontSize: 10, color: "var(--color-accent)", fontWeight: 600 }}>
                        Unsaved changes
                    </span>
                )}
            </div>
            <RoleRow table={tableKey} roleKey={roleFilter} perms={entry[roleFilter]} dirty={anyDirty} onUpdate={(p) => onUpdate(roleFilter, p)} />
        </div>
    );
};

// ── Panel ─────────────────────────────────────────────────────────────────────

const PermissionsPanel = ({ roleFilter }: { roleFilter: "admin" | "staff" }) => {
    const { config, fetchConfig, updateTable, loading, saving } = useTableConfigStore();

    // Local draft — only sent to API on commit
    const [draft, setDraft] = useState<FullTableConfig>(() => cloneConfig(config));

    // Sync draft when server config loads/refreshes
    useEffect(() => { setDraft(cloneConfig(config)); }, [config]);
    useEffect(() => { fetchConfig(); }, []);

    const isDirty = TABLE_KEYS.some((k) => !deepEqual(draft[k]?.[roleFilter], config[k]?.[roleFilter]));
    const isCommitting = saving !== null;

    const handleUpdate = (tableKey: TableKey, roleKey: "admin" | "staff", patch: Partial<RolePerms>) => {
        setDraft((prev) => {
            const next = cloneConfig(prev);
            next[tableKey][roleKey] = { ...next[tableKey][roleKey], ...patch };
            return next;
        });
    };

    const handleDiscard = () => setDraft(cloneConfig(config));

    const handleCommit = async () => {
        // Only patch tables where this role's config changed
        const changed = TABLE_KEYS.filter((k) => !deepEqual(draft[k]?.[roleFilter], config[k]?.[roleFilter]));
        try {
            await Promise.all(changed.map((k) => updateTable(k, { [roleFilter]: draft[k][roleFilter] })));
        } catch (e) {
            alert("Failed to save: " + e);
        }
    };

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
                <h1 className="page-title" style={{ margin: 0 }}>
                    {roleFilter === "admin" ? "Admin" : "Staff"} Permissions
                </h1>
                <button
                    onClick={fetchConfig}
                    disabled={loading}
                    title="Refresh from server"
                    style={{
                        background: "none", border: "none", cursor: loading ? "not-allowed" : "pointer",
                        color: "var(--color-foreground-light)", fontSize: 16, display: "flex", alignItems: "center",
                        opacity: loading ? 0.5 : 1,
                    }}
                >
                    <BiRefresh style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
                </button>

                {isDirty && (
                    <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
                        <button
                            onClick={handleDiscard}
                            disabled={isCommitting}
                            style={{
                                display: "flex", alignItems: "center", gap: 6,
                                padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                                border: "1px solid var(--color-third)", background: "none",
                                color: "var(--color-foreground-light)", cursor: "pointer",
                            }}
                        >
                            <BiX /> Discard
                        </button>
                        <button
                            onClick={handleCommit}
                            disabled={isCommitting}
                            style={{
                                display: "flex", alignItems: "center", gap: 6,
                                padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                                border: "none", background: "var(--color-accent)",
                                color: "var(--color-primary)", cursor: isCommitting ? "not-allowed" : "pointer",
                                opacity: isCommitting ? 0.7 : 1,
                            }}
                        >
                            <BiCheck /> {isCommitting ? "Saving…" : "Commit Changes"}
                        </button>
                    </div>
                )}
            </div>
            <p className="page-subtitle" style={{ marginBottom: 24 }}>
                Toggle permissions per role, then click <strong>Commit Changes</strong> to save.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {TABLE_KEYS.map((k) => (
                    <TableCard
                        key={k}
                        tableKey={k}
                        roleFilter={roleFilter}
                        draft={draft}
                        saved={config}
                        onUpdate={(role, patch) => handleUpdate(k, role, patch)}
                    />
                ))}
            </div>
        </div>
    );
};

export default PermissionsPanel;
