"use client";

import { useState, useEffect, useCallback } from "react";
import { Reservation, Payment } from "@/app/types/ReservationTypes";
import {
    getReservations, createReservation, deleteReservation, updateReservation,
    getPaymentsForReservation, createPayment, updatePayment, deletePayment,
} from "../../actions";
import SpreadsheetTable, { Column, RowEdit } from "../table/SpreadsheetTable";
import { useTablePermissions } from "../../config/useTablePermissions";
import { ActiveFilter, FilterableColumn, filtersToRecord } from "../table/FilterPanel";
import { useTablePrefsStore } from "@/stores/tablePrefsStore";
import styles from "../table/spreadsheetTable.module.css";

const TABLE_TITLE = "Reservations Database";
const EMPTY_FILTERS: ActiveFilter[] = [];

const FILTERABLE_COLUMNS: FilterableColumn[] = [
    { field: "car",         label: "Car (VIN)",  type: "text" },
    { field: "user",        label: "User ID",    type: "number" },
    { field: "pickUpTime",  label: "Pick-up",    type: "date" },
    { field: "dropOffTime", label: "Drop-off",   type: "date" },
];
import {
    BiSave,
    BiX,
    BiRefresh,
    BiTrash,
    BiPlus,
    BiEdit,
    BiCheck,
} from "react-icons/bi";

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmtTimestamp = (ts: number | string) => {
    const d = typeof ts === "string" ? new Date(ts + "T00:00:00") : new Date(ts * 1000);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const toDateString = (epochSec: number): string => {
    const d = new Date(epochSec * 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const fromDateString = (val: string): number =>
    Math.floor(new Date(val + "T00:00:00").getTime() / 1000);

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
    { key: "reservationId", label: "Res #",     defaultVisible: true,  locked: true,  render: (r) => <span className={styles.badge}>#{r.reservationId}</span> },
    { key: "car",           label: "Car",       defaultVisible: true,  render: carLabel, minWidth: 140, editable: true, editType: "text", getValue: (r) => carVin(r) },
    { key: "userId",        label: "User ID",   defaultVisible: true,  render: (r) => userId(r) ?? "—", editable: true, editType: "number", getValue: (r) => userId(r) ?? 0 },
    { key: "pickUpTime",    label: "Pick-up",   defaultVisible: true,  render: (r) => fmtTimestamp(r.pickUpTime as number | string),  editable: true, editType: "date", getValue: (r) => toDateString(r.pickUpTime) },
    { key: "dropOffTime",   label: "Drop-off",  defaultVisible: true,  render: (r) => fmtTimestamp(r.dropOffTime as number | string), editable: true, editType: "date", getValue: (r) => toDateString(r.dropOffTime) },
    { key: "durationDays",  label: "Days",      defaultVisible: true,  render: (r) => `${r.durationDays}d ${r.durationHours % 24}h` },
    { key: "dateBooked",    label: "Booked",    defaultVisible: false, render: (r) => fmtTimestamp(r.dateBooked as number | string) },
    { key: "payments",      label: "Payments",  defaultVisible: true,  render: (r) => Array.isArray(r.payments) ? r.payments.length : 0,
        editable: true, editType: "tags",
        getTagsValue: (r) => Array.isArray(r.payments)
            ? r.payments.map((p) => (typeof p === "string" ? p : (p as Payment).paymentId))
            : [],
    },
];

// ── Payments Preview ─────────────────────────────────────────────────────────

const PAYMENT_TYPES = ["CASH", "CREDIT", "DEBIT", "CHECK", "SERVICE", "INVOICE"];

const fmtInstant = (val: number | string) => {
    const d = typeof val === "number" ? new Date(val * 1000) : new Date(val);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const toIsoDate = (epochSecOrStr: number | string): string => {
    const d = typeof epochSecOrStr === "number" ? new Date(epochSecOrStr * 1000) : new Date(epochSecOrStr);
    return d.toISOString().split("T")[0];
};

interface PaymentRowProps {
    payment: Payment;
    onSave: (patch: Partial<Payment>) => Promise<void>;
    onDelete: () => Promise<void>;
}

const PaymentRow = ({ payment, onSave, onDelete }: PaymentRowProps) => {
    const [editing, setEditing] = useState(false);
    const [totalAmount, setTotalAmount] = useState(String(payment.totalAmount));
    const [amountPaid, setAmountPaid] = useState(String(payment.amountPaid));
    const [date, setDate] = useState(toIsoDate(payment.date));
    const [paymentType, setPaymentType] = useState(payment.paymentType);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave({
                totalAmount: Number(totalAmount),
                amountPaid: Number(amountPaid),
                date: new Date(date + "T00:00:00").toISOString() as unknown as number,
                paymentType,
            });
            setEditing(false);
        } catch (e) { alert("Save failed: " + e); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!confirm("Delete this payment?")) return;
        setDeleting(true);
        try { await onDelete(); }
        catch (e) { alert("Delete failed: " + e); }
        finally { setDeleting(false); }
    };

    return (
        <div className={styles.paymentRow}>
            <div className={styles.paymentRowHeader}>
                <span className={styles.paymentId} title={payment.paymentId}>
                    {payment.paymentId.length > 24 ? payment.paymentId.slice(0, 24) + "…" : payment.paymentId}
                </span>
                <span className={`${styles.badge} ${payment.paid ? styles.badgeGreen : styles.badgeRed}`}>
                    {payment.paid ? "Paid" : "Unpaid"}
                </span>
                <div className={styles.paymentRowActions}>
                    {editing ? (
                        <>
                            <button className={styles.actionBtn} onClick={handleSave} disabled={saving} title="Save">
                                {saving ? <BiRefresh className={styles.spinning} /> : <BiCheck />}
                            </button>
                            <button className={styles.actionBtn} onClick={() => setEditing(false)} title="Cancel">
                                <BiX />
                            </button>
                        </>
                    ) : (
                        <>
                            <button className={styles.actionBtn} onClick={() => setEditing(true)} title="Edit">
                                <BiEdit />
                            </button>
                            <button className={`${styles.actionBtn} ${styles.dangerBtn}`} onClick={handleDelete} disabled={deleting} title="Delete">
                                {deleting ? <BiRefresh className={styles.spinning} /> : <BiTrash />}
                            </button>
                        </>
                    )}
                </div>
            </div>
            {editing ? (
                <div className={styles.paymentEditGrid}>
                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>Total ($)</label>
                        <input type="number" className={styles.fieldInput} value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} step="0.01" />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>Paid ($)</label>
                        <input type="number" className={styles.fieldInput} value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} step="0.01" />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>Date</label>
                        <input type="date" className={styles.fieldInput} value={date} onChange={(e) => setDate(e.target.value)} />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>Type</label>
                        <select className={styles.fieldInput} value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
                            {PAYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>
            ) : (
                <div className={styles.paymentDetails}>
                    <span>${payment.totalAmount.toFixed(2)} total</span>
                    <span>${payment.amountPaid.toFixed(2)} paid</span>
                    <span>{fmtInstant(payment.date)}</span>
                    <span>{payment.paymentType}</span>
                </div>
            )}
        </div>
    );
};

interface AddPaymentFormProps {
    reservationId: number;
    onCreated: () => void;
    onCancel: () => void;
}

const AddPaymentForm = ({ reservationId, onCreated, onCancel }: AddPaymentFormProps) => {
    const [paymentId, setPaymentId] = useState(() => `manual_${Date.now()}`);
    const [totalAmount, setTotalAmount] = useState("");
    const [amountPaid, setAmountPaid] = useState("");
    const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [paymentType, setPaymentType] = useState("CASH");
    const [saving, setSaving] = useState(false);

    const handleCreate = async () => {
        if (!paymentId.trim() || !totalAmount || !date) { alert("Fill in all required fields."); return; }
        setSaving(true);
        try {
            await createPayment({
                paymentId: paymentId.trim(),
                totalAmount: Number(totalAmount),
                amountPaid: Number(amountPaid || 0),
                date: new Date(date + "T00:00:00").toISOString(),
                paymentType,
                reservations: [reservationId],
            });
            onCreated();
        } catch (e) { alert("Create failed: " + e); }
        finally { setSaving(false); }
    };

    return (
        <div className={styles.addPaymentForm}>
            <div className={styles.paymentEditGrid}>
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Payment ID *</label>
                    <input className={styles.fieldInput} value={paymentId} onChange={(e) => setPaymentId(e.target.value)} placeholder="stripe_pi_... or manual_..." />
                </div>
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Total ($) *</label>
                    <input type="number" className={styles.fieldInput} value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} step="0.01" placeholder="0.00" />
                </div>
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Paid ($)</label>
                    <input type="number" className={styles.fieldInput} value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} step="0.01" placeholder="0.00" />
                </div>
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Date *</label>
                    <input type="date" className={styles.fieldInput} value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Type</label>
                    <select className={styles.fieldInput} value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
                        {PAYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>
            <div className={styles.formActions}>
                <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={handleCreate} disabled={saving}>
                    {saving ? <BiRefresh className={styles.spinning} /> : <BiCheck />} Add
                </button>
                <button className={styles.actionBtn} onClick={onCancel} style={{ opacity: 0.6 }}><BiX /></button>
            </div>
        </div>
    );
};

const PaymentsPreview = ({ reservation }: { reservation: Reservation }) => {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try { setPayments(await getPaymentsForReservation(reservation.reservationId)); }
        catch { setPayments([]); }
        finally { setLoading(false); }
    }, [reservation.reservationId]);

    useEffect(() => { load(); }, [load]);

    return (
        <div className={styles.previewPanel}>
            <div className={styles.previewPanelHeader}>
                <span className={styles.previewPanelTitle}>Reservation #{reservation.reservationId} — Payments</span>
            </div>
            {loading ? (
                <div style={{ padding: "12px 16px", opacity: 0.5, fontSize: 13 }}>Loading…</div>
            ) : payments.length === 0 && !adding ? (
                <div style={{ padding: "12px 16px", opacity: 0.5, fontSize: 13 }}>No payments</div>
            ) : (
                <div className={styles.paymentsList}>
                    {payments.map((p) => (
                        <PaymentRow
                            key={p.paymentId}
                            payment={p}
                            onSave={async (patch) => { await updatePayment(p.paymentId, patch as Record<string, unknown>); await load(); }}
                            onDelete={async () => { await deletePayment(p.paymentId); await load(); }}
                        />
                    ))}
                </div>
            )}
            {adding ? (
                <AddPaymentForm
                    reservationId={reservation.reservationId}
                    onCreated={() => { setAdding(false); load(); }}
                    onCancel={() => setAdding(false)}
                />
            ) : (
                <button className={styles.addPaymentBtn} onClick={() => setAdding(true)}>
                    <BiPlus /> Add Payment
                </button>
            )}
        </div>
    );
};

// ── Edit Form ────────────────────────────────────────────────────────────────

interface EditFormProps {
    res: Reservation;
    onSave: (patch: { pickUpTime?: number; dropOffTime?: number; car?: string; user?: number }) => Promise<void>;
    onCancel: () => void;
}

const EditForm = ({ res, onSave, onCancel }: EditFormProps) => {
    const vin = carVin(res);
    const uid = userId(res);
    const [pickUp, setPickUp] = useState(toDateString(res.pickUpTime));
    const [dropOff, setDropOff] = useState(toDateString(res.dropOffTime));
    const [vinVal, setVinVal] = useState(vin);
    const [userIdVal, setUserIdVal] = useState(String(uid));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const patch: Parameters<typeof onSave>[0] = {};
            const newPickUp = fromDateString(pickUp);
            const newDropOff = fromDateString(dropOff);
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
                    <input type="date" className={styles.fieldInput} value={pickUp} onChange={(e) => setPickUp(e.target.value)} />
                </div>
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Drop-off</label>
                    <input type="date" className={styles.fieldInput} value={dropOff} onChange={(e) => setDropOff(e.target.value)} />
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
    const { isAdmin, canEdit, canDelete, canAddRow, lockedCols, permanentlyLockedCols } = useTablePermissions("reservations");

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
    const [sortBy, setSortBy] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
    const storedFilters = useTablePrefsStore((s) => s.tableFilters[TABLE_TITLE]);
    const storeSetFilters = useTablePrefsStore((s) => s.setTableFilters);
    const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>((storedFilters ?? EMPTY_FILTERS) as ActiveFilter[]);
    const handleFiltersChange = (f: ActiveFilter[]) => { setActiveFilters(f); storeSetFilters(TABLE_TITLE, f); };

    const fetchPage = useCallback(async (p: number, ps: number, sb: string | null, sd: "asc" | "desc", filters: ActiveFilter[] = [], isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(p), pageSize: String(ps) });
            if (sb) { params.set("sortBy", sb); params.set("sortDir", sd); }
            Object.entries(filtersToRecord(filters)).forEach(([k, v]) => { if (v !== undefined) params.set(k, String(v)); });
            const res = await fetch(`/api/reservations?${params}`, { cache: "no-store" });
            if (!res.ok) throw new Error(`${res.status}`);
            const data = await res.json();
            setReservations(data?.data ?? []);
            setTotalPages(data?.totalPages ?? 1);
            setTotalItems(data?.totalItems ?? 0);
        } catch (e) {
            alert("Failed to fetch reservations: " + e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchPage(page, pageSize, sortBy, sortDir, activeFilters); }, [page, pageSize, fetchPage]);
    useEffect(() => { setPage(1); fetchPage(1, pageSize, sortBy, sortDir, activeFilters); }, [activeFilters]);

    const handlePageChange = (p: number) => { setPage(p); setSelected(new Set()); };
    const handlePageSizeChange = (ps: number) => { setPageSize(ps); setPage(1); setSelected(new Set()); };
    const handleRefresh = () => fetchPage(page, pageSize, sortBy, sortDir, activeFilters, true);

    const handleSortChange = (col: string, dir: "asc" | "desc") => {
        setSortBy(col); setSortDir(dir); setPage(1);
        fetchPage(1, pageSize, col, dir, activeFilters);
    };

    const handleBulkDelete = async () => {
        const ids = [...selected] as number[];
        if (!window.confirm(`Delete ${ids.length} reservation${ids.length !== 1 ? "s" : ""}? This cannot be undone.`)) return;
        setBulkDeleting(true);
        const results = await Promise.allSettled(ids.map((id) => deleteReservation(id)));
        const failed = ids.filter((_, i) => results[i].status === "rejected");
        setBulkDeleting(false);
        if (failed.length) alert(`${failed.length} deletion(s) failed.`);
        setSelected(new Set(failed));
        fetchPage(page, pageSize, sortBy, sortDir, activeFilters, true);
    };

    const handleEdit = (res: Reservation) => setEditing(res);

    const handleDeleteOne = async (res: Reservation) => {
        if (!window.confirm(`Delete reservation #${res.reservationId}? This cannot be undone.`)) return;
        try {
            await deleteReservation(res.reservationId);
            fetchPage(page, pageSize, sortBy, sortDir, activeFilters, true);
        } catch (e) {
            alert("Delete failed: " + e);
        }
    };

    const handleCreateRow = async (data: Record<string, string | string[]>) => {
        const paymentIds = Array.isArray(data.payments) ? data.payments as string[] : [];
        await createReservation({
            car:         String(data.car ?? ""),
            user:        Number(data.userId ?? 0),
            pickUpTime:  fromDateString(String(data.pickUpTime ?? "")),
            dropOffTime: fromDateString(String(data.dropOffTime ?? "")),
            ...(paymentIds.length > 0 ? { payments: paymentIds } : {}),
        });
        fetchPage(page, pageSize, sortBy, sortDir, activeFilters, true);
    };

    const handleSaveEdits = async (edits: RowEdit<Reservation>[]) => {
        for (const { original, patch } of edits) {
            const changingDates = patch.pickUpTime !== undefined || patch.dropOffTime !== undefined;
            if (changingDates) {
                const newPickUp  = patch.pickUpTime  !== undefined ? fromDateString(String(patch.pickUpTime))  : original.pickUpTime;
                const newDropOff = patch.dropOffTime !== undefined ? fromDateString(String(patch.dropOffTime)) : original.dropOffTime;
                if (newPickUp >= newDropOff) {
                    alert(`Invalid dates for reservation #${original.reservationId}: pick-up must be before drop-off.`);
                    return;
                }
            }
        }
        await Promise.all(edits.map(({ id, original, patch }) => {
            const apiPatch: { pickUpTime?: number; dropOffTime?: number; car?: string; user?: number } = {};
            const changingDates = patch.pickUpTime !== undefined || patch.dropOffTime !== undefined;
            if (changingDates) {
                // Send dropOffTime first so backend setter sees it before validating pickUpTime
                apiPatch.dropOffTime = patch.dropOffTime !== undefined ? fromDateString(String(patch.dropOffTime)) : original.dropOffTime;
                apiPatch.pickUpTime  = patch.pickUpTime  !== undefined ? fromDateString(String(patch.pickUpTime))  : original.pickUpTime;
            }
            if (patch.car !== undefined)     apiPatch.car  = String(patch.car);
            if (patch.userId !== undefined)  apiPatch.user = Number(patch.userId);
            if (patch.payments !== undefined) (apiPatch as Record<string, unknown>).payments = patch.payments;
            return updateReservation(id as number, apiPatch);
        }));
        fetchPage(page, pageSize, sortBy, sortDir, activeFilters, true);
    };

    const handleSaveEdit = async (patch: { pickUpTime?: number; dropOffTime?: number; car?: string; user?: number }) => {
        if (!editing) return;
        await updateReservation(editing.reservationId, patch);
        setEditing(null);
        fetchPage(page, pageSize, sortBy, sortDir, activeFilters, true);
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
                onBulkDelete={canDelete ? handleBulkDelete : undefined}
                bulkDeleting={bulkDeleting}
                onEdit={handleEdit}
                onDeleteOne={canDelete ? handleDeleteOne : undefined}
                onRefresh={handleRefresh}
                filterableColumns={FILTERABLE_COLUMNS}
                activeFilters={activeFilters}
                onFiltersChange={handleFiltersChange}
                title="Reservations Database"
                subtitle={query ? `${filtered.length} matching on this page` : undefined}
                searchQuery={query}
                onSearchChange={setQuery}
                searchPlaceholder="Filter by vehicle, reservation ID or user ID\u2026"
                emptyMessage="No reservations found."
                onSaveEdits={canEdit ? handleSaveEdits : undefined}
                onCreateRow={canAddRow ? handleCreateRow : undefined}
                initialLockedCols={lockedCols}
                permanentlyLockedCols={permanentlyLockedCols}
                sortBy={sortBy}
                sortDir={sortDir}
                onSortChange={handleSortChange}
                renderPreview={(r) => <PaymentsPreview reservation={r} />}
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
