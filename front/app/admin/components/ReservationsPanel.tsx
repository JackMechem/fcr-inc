"use client";

import { useState, useEffect, useCallback } from "react";
import { Reservation } from "@/app/types/ReservationTypes";
import { updateReservation, deleteReservation } from "@/app/lib/AdminApiCalls";
import { getAllReservations } from "@/app/lib/ReservationApi";
import { useUserDashboardStore } from "@/stores/userDashboardStore";
import SpreadsheetTable, { Column } from "./SpreadsheetTable";
import styles from "./spreadsheetTable.module.css";
import {
    BiSave,
    BiX,
    BiRefresh,
} from "react-icons/bi";

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmtTimestamp = (ts: number) =>
    new Date(ts * 1000).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
    });

const toDatetimeLocal = (epochSec: number): string => {
    const d = new Date(epochSec * 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fromDatetimeLocal = (val: string): number =>
    Math.floor(new Date(val).getTime() / 1000);

const carLabel = (r: Reservation) => {
    if (typeof r.car === "object" && r.car !== null) return `${r.car.make} ${r.car.model}`;
    return String(r.car);
};

const carVin = (r: Reservation) =>
    typeof r.car === "object" && r.car !== null ? r.car.vin : String(r.car);

const userId = (r: Reservation) =>
    typeof r.user === "object" && r.user !== null
        ? (r.user as Record<string, unknown>).userId as number
        : (r.user as number);

// ── Column definitions ───────────────────────────────────────────────────────

const RES_COLUMNS: Column<Reservation>[] = [
    { key: "reservationId", label: "Res #",     defaultVisible: true,  render: (r) => <span className={styles.badge}>#{r.reservationId}</span> },
    { key: "car",           label: "Vehicle",   defaultVisible: true,  render: carLabel, minWidth: 140 },
    { key: "carVin",        label: "Car VIN",   defaultVisible: false, render: (r) => carVin(r), minWidth: 170 },
    { key: "userId",        label: "User ID",   defaultVisible: true,  render: (r) => userId(r) ?? "—" },
    { key: "pickUpTime",    label: "Pick-up",   defaultVisible: true,  render: (r) => fmtTimestamp(r.pickUpTime) },
    { key: "dropOffTime",   label: "Drop-off",  defaultVisible: true,  render: (r) => fmtTimestamp(r.dropOffTime) },
    { key: "durationDays",  label: "Days",      defaultVisible: true,  render: (r) => `${r.durationDays}d ${r.durationHours % 24}h` },
    { key: "dateBooked",    label: "Booked",    defaultVisible: false, render: (r) => fmtTimestamp(r.dateBooked) },
    { key: "payments",      label: "Payments",  defaultVisible: false, render: (r) => Array.isArray(r.payments) ? r.payments.length : 0 },
];

// ── Edit Form ────────────────────────────────────────────────────────────────

interface EditFormProps {
    res: Reservation;
    onSave: (patch: { pickUpTime?: number; dropOffTime?: number; car?: string; user?: number }) => Promise<void>;
    onCancel: () => void;
}

const EditForm = ({ res, onSave, onCancel }: EditFormProps) => {
    const vin = carVin(res);
    const uid = userId(res);
    const [pickUp, setPickUp] = useState(toDatetimeLocal(res.pickUpTime));
    const [dropOff, setDropOff] = useState(toDatetimeLocal(res.dropOffTime));
    const [vinVal, setVinVal] = useState(vin);
    const [userIdVal, setUserIdVal] = useState(String(uid));
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
            if (vinVal !== vin) patch.car = vinVal;
            const newUid = Number(userIdVal);
            if (newUid !== uid) patch.user = newUid;
            await onSave(patch);
        } catch (e) {
            setError(String(e));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={styles.editArea}>
            <div className={styles.editAreaHeader}>
                <span className={styles.editAreaTitle}>
                    Edit Reservation #{res.reservationId}
                </span>
                <button className={`${styles.actionBtn}`} onClick={onCancel} style={{ opacity: 0.6 }}>
                    <BiX />
                </button>
            </div>
            <div className={styles.editGrid}>
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Pick-up</label>
                    <input type="datetime-local" className={styles.fieldInput} value={pickUp} onChange={(e) => setPickUp(e.target.value)} />
                </div>
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Drop-off</label>
                    <input type="datetime-local" className={styles.fieldInput} value={dropOff} onChange={(e) => setDropOff(e.target.value)} />
                </div>
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Car VIN</label>
                    <input className={styles.fieldInput} value={vinVal} onChange={(e) => setVinVal(e.target.value)} />
                </div>
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>User ID</label>
                    <input type="number" className={styles.fieldInput} value={userIdVal} onChange={(e) => setUserIdVal(e.target.value)} />
                </div>
            </div>
            {error && <p style={{ color: "#ef4444", fontSize: "9.5pt", marginTop: 8 }}>{error}</p>}
            <div className={styles.formActions}>
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

// ── Panel ────────────────────────────────────────────────────────────────────

const ReservationsPanel = () => {
    const { role } = useUserDashboardStore();
    const isAdmin = role === "ADMIN";

    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<Set<string | number>>(new Set());
    const [bulkDeleting, setBulkDeleting] = useState(false);
    const [editing, setEditing] = useState<Reservation | null>(null);

    const fetchPage = useCallback(async (p: number, ps: number, isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        try {
            const res = await getAllReservations({ page: p, pageSize: ps });
            setReservations(res.data);
            setTotalPages(res.totalPages);
            setTotalItems(res.totalItems);
        } catch (e) {
            alert("Failed to fetch reservations: " + e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchPage(page, pageSize); }, [page, pageSize, fetchPage]);

    const handlePageChange = (p: number) => { setPage(p); setSelected(new Set()); };
    const handlePageSizeChange = (ps: number) => { setPageSize(ps); setPage(1); setSelected(new Set()); };
    const handleRefresh = () => fetchPage(page, pageSize, true);

    const handleBulkDelete = async () => {
        const ids = [...selected] as number[];
        if (!window.confirm(`Delete ${ids.length} reservation${ids.length !== 1 ? "s" : ""}? This cannot be undone.`)) return;
        setBulkDeleting(true);
        const results = await Promise.allSettled(ids.map((id) => deleteReservation(id)));
        const failed = ids.filter((_, i) => results[i].status === "rejected");
        setBulkDeleting(false);
        if (failed.length) alert(`${failed.length} deletion(s) failed.`);
        setSelected(new Set(failed));
        fetchPage(page, pageSize, true);
    };

    const handleEdit = (res: Reservation) => setEditing(res);

    const handleDeleteOne = async (res: Reservation) => {
        if (!window.confirm(`Delete reservation #${res.reservationId}? This cannot be undone.`)) return;
        try {
            await deleteReservation(res.reservationId);
            fetchPage(page, pageSize, true);
        } catch (e) {
            alert("Delete failed: " + e);
        }
    };

    const handleSaveEdit = async (patch: { pickUpTime?: number; dropOffTime?: number; car?: string; user?: number }) => {
        if (!editing) return;
        await updateReservation(editing.reservationId, patch);
        setEditing(null);
        fetchPage(page, pageSize, true);
    };

    const filtered = query
        ? reservations.filter((r) => {
              const carStr = carLabel(r);
              const uid = userId(r);
              return `${carStr} ${r.reservationId} ${uid}`.toLowerCase().includes(query.toLowerCase());
          })
        : reservations;

    return (
        <>
            <SpreadsheetTable<Reservation>
                columns={RES_COLUMNS}
                data={filtered}
                getRowId={(r) => r.reservationId}
                page={page}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                loading={loading}
                refreshing={refreshing}
                isAdmin={isAdmin}
                selected={selected}
                onSelectionChange={setSelected}
                onBulkDelete={handleBulkDelete}
                bulkDeleting={bulkDeleting}
                onEdit={handleEdit}
                onDeleteOne={handleDeleteOne}
                onRefresh={handleRefresh}
                title="Reservation Database"
                subtitle={query ? `${filtered.length} matching on this page` : undefined}
                searchQuery={query}
                onSearchChange={setQuery}
                searchPlaceholder="Filter by vehicle, reservation ID or user ID\u2026"
                emptyMessage="No reservations found."
            />
            {editing && (
                <EditForm
                    res={editing}
                    onSave={handleSaveEdit}
                    onCancel={() => setEditing(null)}
                />
            )}
        </>
    );
};

export default ReservationsPanel;
