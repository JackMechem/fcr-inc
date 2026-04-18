"use client";

import { useState, useEffect } from "react";
import { Reservation } from "@/app/types/ReservationTypes";
import { Account, updateReservation, deleteReservation } from "@/app/lib/AdminApiCalls";
import BulkActionsBar from "./BulkActionsBar";
import Image from "next/image";
import {
    BiSearch,
    BiCar,
    BiRefresh,
    BiChevronDown,
    BiChevronUp,
    BiEdit,
    BiSave,
    BiX,
    BiTrash,
    BiUser,
} from "react-icons/bi";
import styles from "./inventoryPanel.module.css";
import userStyles from "./usersPanel.module.css";
import { LoadingSkeleton, EmptyState } from "./PanelLoading";

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtTimestamp = (ts: number) =>
    new Date(ts * 1000).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
    });

const toDatetimeLocal = (epochSec: number): string => {
    const d = new Date(epochSec * 1000);
    // format as YYYY-MM-DDTHH:MM for datetime-local input
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fromDatetimeLocal = (val: string): number =>
    Math.floor(new Date(val).getTime() / 1000);

const fmt = (key: string) =>
    key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

const Badge = ({ children }: { children: React.ReactNode }) => (
    <span className={styles.badge}>{children}</span>
);

const SKIP_CAR = new Set(["vin", "make", "model", "modelYear", "images", "description"]);

// ── Edit Form ─────────────────────────────────────────────────────────────────

interface EditFormProps {
    res: Reservation;
    onSave: (patch: { pickUpTime?: number; dropOffTime?: number; car?: string; user?: number }) => Promise<void>;
    onCancel: () => void;
}

const EditForm = ({ res, onSave, onCancel }: EditFormProps) => {
    const carVin = typeof res.car === "string" ? res.car : res.car.vin;
    const [pickUp, setPickUp] = useState(toDatetimeLocal(res.pickUpTime));
    const [dropOff, setDropOff] = useState(toDatetimeLocal(res.dropOffTime));
    const [vin, setVin] = useState(carVin);
    const [userId, setUserId] = useState(String(typeof res.user === "object" ? res.user.userId : res.user));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const patch: Parameters<typeof onSave>[0] = {};
            const newPickUp = fromDatetimeLocal(pickUp);
            const newDropOff = fromDatetimeLocal(dropOff);
            if (newPickUp !== res.pickUpTime) patch.pickUpTime = newPickUp;
            if (newDropOff !== res.dropOffTime) patch.dropOffTime = newDropOff;
            if (vin !== carVin) patch.car = vin;
            const newUserId = Number(userId);
            const origUserId = typeof res.user === "object" ? res.user.userId : res.user;
            if (newUserId !== origUserId) patch.user = newUserId;
            await onSave(patch);
        } catch (e) {
            setError(String(e));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={userStyles.editForm}>
            <p className={styles.columnLabel}>Edit Reservation #{res.reservationId}</p>
            <div className={userStyles.editGrid}>
                <div className={userStyles.fieldGroup}>
                    <label className={userStyles.fieldLabel}>Pick-up</label>
                    <input type="datetime-local" className={userStyles.fieldInput} value={pickUp} onChange={(e) => setPickUp(e.target.value)} />
                </div>
                <div className={userStyles.fieldGroup}>
                    <label className={userStyles.fieldLabel}>Drop-off</label>
                    <input type="datetime-local" className={userStyles.fieldInput} value={dropOff} onChange={(e) => setDropOff(e.target.value)} />
                </div>
                <div className={userStyles.fieldGroup}>
                    <label className={userStyles.fieldLabel}>Car VIN</label>
                    <input className={userStyles.fieldInput} value={vin} onChange={(e) => setVin(e.target.value)} />
                </div>
                <div className={userStyles.fieldGroup}>
                    <label className={userStyles.fieldLabel}>User ID</label>
                    <input type="number" className={userStyles.fieldInput} value={userId} onChange={(e) => setUserId(e.target.value)} />
                </div>
            </div>
            {error && <p style={{ color: "#ef4444", fontSize: "9.5pt" }}>{error}</p>}
            <div className={userStyles.formActions}>
                <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={handleSave} disabled={saving}>
                    {saving ? <BiRefresh className={styles.spinning} /> : <BiSave />}
                </button>
                <button className={styles.actionBtn} onClick={onCancel} style={{ opacity: 0.6 }}>
                    <BiX />
                </button>
            </div>
        </div>
    );
};

// ── Expanded Row ──────────────────────────────────────────────────────────────

interface ExpandedRowProps {
    res: Reservation;
    acctId: number | null;
    onUpdate: (patch: { pickUpTime?: number; dropOffTime?: number; car?: string; user?: number }) => Promise<void>;
    onDelete: () => Promise<void>;
}

const ExpandedRow = ({ res, acctId, onUpdate, onDelete }: ExpandedRowProps) => {
    const [editing, setEditing] = useState(false);
    const user = typeof res.user === "object" && res.user !== null ? res.user as Record<string, unknown> : null;
    const userId = typeof res.user === "object" ? (res.user as Record<string, unknown>).userId as number : res.user as number;
    const car = typeof res.car === "object" ? res.car : null;
    const carDetails = car ? Object.entries(car).filter(([k]) => !SKIP_CAR.has(k)) : [];

    const handleSave = async (patch: Parameters<typeof onUpdate>[0]) => {
        await onUpdate(patch);
        setEditing(false);
    };

    return (
        <div className={styles.expandedSection} style={{ flexDirection: "column", gap: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
                {/* Left: reservation + customer details */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Reservation details */}
                    <div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                            <p className={styles.columnLabel}>Reservation</p>
                            <div style={{ display: "flex", gap: 6 }}>
                                {!editing && (
                                    <button
                                        className={`${styles.actionBtn} ${styles.editBtn}`}
                                        onClick={() => setEditing(true)}
                                        title="Edit reservation"
                                    >
                                        <BiEdit />
                                    </button>
                                )}
                                <button
                                    className={`${styles.actionBtn} ${userStyles.deleteBtn}`}
                                    onClick={onDelete}
                                    title="Delete reservation"
                                >
                                    <BiTrash />
                                </button>
                            </div>
                        </div>

                        {editing ? (
                            <EditForm res={res} onSave={handleSave} onCancel={() => setEditing(false)} />
                        ) : (
                            <div className={styles.detailsGrid}>
                                {[
                                    ["ID", String(res.reservationId)],
                                    ["Booked", fmtTimestamp(res.dateBooked)],
                                    ["Pick-up", fmtTimestamp(res.pickUpTime)],
                                    ["Drop-off", fmtTimestamp(res.dropOffTime)],
                                    ["Duration", `${res.durationDays}d ${res.durationHours % 24}h`],
                                    ["Payments", String(Array.isArray(res.payments) ? res.payments.length : 0)],
                                ].map(([label, value]) => (
                                    <div key={label}>
                                        <p className={styles.columnLabel}>{label}</p>
                                        <p className={styles.detailValue}>{value}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Customer details */}
                    <div>
                        <p className={styles.columnLabel}>Customer</p>
                        <div className={styles.detailsGrid}>
                            <div>
                                <p className={styles.columnLabel}>User ID</p>
                                <p className={styles.detailValue}>{userId ?? "—"}</p>
                            </div>
                            <div>
                                <p className={styles.columnLabel}>Account ID</p>
                                <p className={styles.detailValue}>{acctId ?? "—"}</p>
                            </div>
                            {user && (
                                <>
                                    <div>
                                        <p className={styles.columnLabel}>Name</p>
                                        <p className={styles.detailValue}>{String(user.firstName)} {String(user.lastName)}</p>
                                    </div>
                                    <div>
                                        <p className={styles.columnLabel}>Email</p>
                                        <p className={styles.detailValue}>{String(user.email ?? "—")}</p>
                                    </div>
                                    <div>
                                        <p className={styles.columnLabel}>Phone</p>
                                        <p className={styles.detailValue}>{String(user.phoneNumber ?? "—")}</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Vehicle specs */}
                    {carDetails.length > 0 && (
                        <div>
                            <p className={styles.columnLabel}>Vehicle Specs</p>
                            <div className={styles.detailsGrid}>
                                {carDetails.map(([key, val]) => (
                                    <div key={key}>
                                        <p className={styles.columnLabel}>{fmt(key)}</p>
                                        <p className={styles.detailValue}>
                                            {Array.isArray(val) ? (val.length ? val.join(", ") : "—") : String(val ?? "—")}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: gallery */}
                <div>
                    <p className={styles.columnLabel}>Gallery</p>
                    {car?.images?.length ? (
                        <div className={styles.galleryScroll}>
                            {car.images.map((url, i) => (
                                <div key={i} className={styles.thumbnail} style={{ width: "110px", height: "74px", flexShrink: 0 }}>
                                    <Image src={url} alt="" fill className={styles.objectCover} sizes="110px"
                                        onError={(e) => (e.currentTarget.style.display = "none")} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className={styles.carYear}>No images.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

// ── Main Panel ────────────────────────────────────────────────────────────────

interface Props {
    reservations: Reservation[];
    accounts: Account[];
    onRefresh: () => Promise<void>;
}

const ReservationsPanel = ({ reservations: initialReservations, accounts, onRefresh }: Props) => {
    const [reservations, setReservations] = useState<Reservation[]>(initialReservations);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState("");
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [bulkDeleting, setBulkDeleting] = useState(false);

    useEffect(() => { setReservations(initialReservations); }, [initialReservations]);

    // Build userId → acctId map from accounts
    const userToAcct = new Map<number, number>(
        accounts.filter((a) => a.user != null).map((a) => [a.user as number, a.acctId])
    );

    const fetchReservations = async () => {
        setLoading(true);
        try { await onRefresh(); } catch (e) { alert("Fetch failed: " + e); } finally { setLoading(false); }
    };

    const handleUpdate = (reservationId: number) => async (patch: { pickUpTime?: number; dropOffTime?: number; car?: string; user?: number }) => {
        await updateReservation(reservationId, patch);
        setReservations((prev) => prev.map((r) =>
            r.reservationId === reservationId ? { ...r, ...patch } : r
        ));
    };

    const handleDelete = (reservationId: number) => async () => {
        if (!window.confirm(`Delete reservation #${reservationId}? This cannot be undone.`)) return;
        await deleteReservation(reservationId);
        setReservations((prev) => prev.filter((r) => r.reservationId !== reservationId));
        setSelected((prev) => { const n = new Set(prev); n.delete(reservationId); return n; });
        if (expandedId === reservationId) setExpandedId(null);
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Delete ${selected.size} reservation${selected.size !== 1 ? "s" : ""}? This cannot be undone.`)) return;
        setBulkDeleting(true);
        const ids = [...selected];
        const results = await Promise.allSettled(ids.map((id) => deleteReservation(id)));
        const deleted = ids.filter((_, i) => results[i].status === "fulfilled");
        const failed = ids.filter((_, i) => results[i].status === "rejected");
        setReservations((prev) => prev.filter((r) => !deleted.includes(r.reservationId)));
        setSelected(new Set(failed));
        if (expandedId && deleted.includes(expandedId)) setExpandedId(null);
        setBulkDeleting(false);
        if (failed.length) alert(`${failed.length} deletion(s) failed.`);
    };

    const toggleSelect = (id: number) =>
        setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

    const filtered = reservations.filter((r) => {
        const carStr = typeof r.car === "object"
            ? `${r.car.make} ${r.car.model} ${r.car.vin}`
            : r.car;
        const userId = typeof r.user === "object" ? String((r.user as Record<string, unknown>).userId) : String(r.user);
        return `${carStr} ${r.reservationId} ${userId}`.toLowerCase().includes(query.toLowerCase());
    });

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h2 className="page-title">Reservations</h2>
                    <p className="page-subtitle">{filtered.length} of {reservations.length} reservations</p>
                </div>
                <button onClick={fetchReservations} disabled={loading} className={`${styles.btn} ${styles.btnRefresh}`}>
                    <BiRefresh className={loading ? styles.spinning : ""} />
                    Refresh
                </button>
            </div>

            <div className={styles.searchWrapper}>
                <BiSearch className={styles.searchIcon} />
                <input
                    className={styles.searchInput}
                    placeholder="Search by make, model, VIN, reservation ID or user ID…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

            {selected.size > 0 && (
                <BulkActionsBar
                    count={selected.size}
                    deleting={bulkDeleting}
                    onDelete={handleBulkDelete}
                    onClear={() => setSelected(new Set())}
                />
            )}

            <div className={styles.tableContainer}>
                <div className={styles.tableHeader} style={{ gridTemplateColumns: "28px 2fr 0.6fr 0.8fr 1fr 1fr auto" }}>
                    <div className={styles.cbCell}>
                        <input
                            type="checkbox"
                            className={styles.cb}
                            checked={filtered.length > 0 && filtered.every((r) => selected.has(r.reservationId))}
                            onChange={(e) => setSelected(e.target.checked ? new Set(filtered.map((r) => r.reservationId)) : new Set())}
                        />
                    </div>
                    {["Vehicle", "Res #", "User / Acct", "Pick-up", "Drop-off", ""].map((h) => (
                        <p key={h} className={styles.columnLabel}>{h}</p>
                    ))}
                </div>

                <div className={styles.rowList}>
                    {loading ? (
                        <LoadingSkeleton label="Refreshing reservations…" />
                    ) : filtered.length === 0 ? (
                        <EmptyState icon={<BiCar />} message="No reservations match your search." />
                    ) : (
                        filtered.map((res) => {
                            const isExpanded = expandedId === res.reservationId;
                            const car = typeof res.car === "object" ? res.car : null;
                            const carVin = typeof res.car === "string" ? res.car : res.car.vin;
                            const userId = typeof res.user === "object"
                                ? (res.user as Record<string, unknown>).userId as number
                                : res.user as number;
                            const acctId = userToAcct.get(userId) ?? null;

                            return (
                                <div key={res.reservationId}>
                                    <div
                                        className={styles.summaryRow}
                                        style={{ gridTemplateColumns: "28px 2fr 0.6fr 0.8fr 1fr 1fr auto" }}
                                        onClick={() => setExpandedId(isExpanded ? null : res.reservationId)}
                                    >
                                        <div className={styles.cbCell} onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                className={styles.cb}
                                                checked={selected.has(res.reservationId)}
                                                onChange={() => toggleSelect(res.reservationId)}
                                            />
                                        </div>
                                        {/* Vehicle */}
                                        <div className={styles.vehicleCell}>
                                            <div className={styles.thumbnail} style={{ width: 52, height: 36 }}>
                                                {car?.images?.[0] ? (
                                                    <Image src={car.images[0]} alt="" fill className={styles.objectCover} sizes="52px"
                                                        onError={(e) => (e.currentTarget.style.display = "none")} />
                                                ) : (
                                                    <div className={styles.placeholderIconWrapper}><BiCar /></div>
                                                )}
                                            </div>
                                            <div className={styles.minWidthZero}>
                                                <p className={styles.carTitle}>{car ? `${car.make} ${car.model}` : carVin}</p>
                                                <p className={styles.carYear}>{car?.modelYear ?? ""}</p>
                                            </div>
                                        </div>

                                        {/* Reservation ID */}
                                        <div className={styles.hideMobile}>
                                            <Badge>#{res.reservationId}</Badge>
                                        </div>

                                        {/* User / Account IDs */}
                                        <div className={`${styles.hideMobile}`} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                            <span style={{ fontSize: "9.5pt", color: "var(--color-foreground)", display: "flex", alignItems: "center", gap: 4 }}>
                                                <BiUser style={{ opacity: 0.5, flexShrink: 0 }} />
                                                {userId ?? "—"}
                                            </span>
                                            {acctId != null && (
                                                <span style={{ fontSize: "9pt", color: "var(--color-foreground-light)" }}>
                                                    acct #{acctId}
                                                </span>
                                            )}
                                        </div>

                                        {/* Pick-up */}
                                        <p className={`${styles.carYear} ${styles.hideMobile}`} style={{ fontSize: "10pt", color: "var(--color-foreground)" }}>
                                            {fmtTimestamp(res.pickUpTime)}
                                        </p>

                                        {/* Drop-off */}
                                        <p className={`${styles.carYear} ${styles.hideMobile}`} style={{ fontSize: "10pt", color: "var(--color-foreground)" }}>
                                            {fmtTimestamp(res.dropOffTime)}
                                        </p>

                                        {/* Chevron */}
                                        <div className={styles.actionGroup} onClick={(e) => e.stopPropagation()}>
                                            <span className={styles.chevronIcon}>
                                                {isExpanded ? <BiChevronUp /> : <BiChevronDown />}
                                            </span>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <ExpandedRow
                                            res={res}
                                            acctId={acctId}
                                            onUpdate={handleUpdate(res.reservationId)}
                                            onDelete={handleDelete(res.reservationId)}
                                        />
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReservationsPanel;
