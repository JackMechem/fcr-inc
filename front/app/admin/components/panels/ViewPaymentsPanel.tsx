"use client";

import { useState, useEffect, useCallback } from "react";
import { Payment } from "@/app/types/ReservationTypes";
import SpreadsheetTable, { Column, RowEdit } from "../table/SpreadsheetTable";
import { useTablePermissions } from "../../config/useTablePermissions";
import { ActiveFilter, FilterableColumn, filtersToRecord } from "../table/FilterPanel";
import { useTablePrefsStore } from "@/stores/tablePrefsStore";

const TABLE_TITLE = "All Payments";
const EMPTY_FILTERS: ActiveFilter[] = [];

const FILTERABLE_COLUMNS: FilterableColumn[] = [
    { field: "paymentType", label: "Type",    type: "select", options: ["CASH", "CREDIT", "DEBIT", "CHECK", "SERVICE", "INVOICE"] },
    { field: "paid",        label: "Paid",    type: "select", options: ["true", "false"] },
    { field: "totalAmount", label: "Total",   type: "number" },
    { field: "amountPaid",  label: "Amount Paid", type: "number" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtDate = (val: number | string) => {
    const ms = typeof val === "number" ? val * 1000 : new Date(val).getTime();
    return new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const fmtCurrency = (n: number) =>
    `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ── Stripe detail types ───────────────────────────────────────────────────────

interface StripeReservation {
    reservationId: number;
    pickUpTime: string;
    dropOffTime: string;
    dateBooked: string;
    car: { vin: string; make: string; model: string; [key: string]: unknown } | null;
    user: { userId: number; firstName: string; lastName: string; [key: string]: unknown } | null;
    [key: string]: unknown;
}

interface StripePaymentDetail {
    paymentId: string;
    paymentType: string;
    totalAmount: number;
    amountPaid: number;
    date: string;
    reservations: StripeReservation[];
    [key: string]: unknown;
}

// ── Preview components ────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-foreground-light)" }}>
                {label}
            </span>
            <span style={{ fontSize: 13, color: "var(--color-foreground)" }}>{children}</span>
        </div>
    );
}

function SubField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: "var(--color-foreground-light)", minWidth: 100, flexShrink: 0 }}>{label}</span>
            <span style={{ fontSize: 12, color: "var(--color-foreground)", wordBreak: "break-all" }}>{children}</span>
        </div>
    );
}

const STRIPE_PREFIXES = ["pi_", "cs_"];

function PaymentPreview({ payment }: { payment: Payment }) {
    const isStripe = STRIPE_PREFIXES.some((pfx) => payment.paymentId.startsWith(pfx));
    const [data, setData] = useState<StripePaymentDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isStripe) return;
        setLoading(true);
        setError(null);
        setData(null);
        fetch(`/api/stripe/${encodeURIComponent(payment.paymentId)}`, { cache: "no-store" })
            .then(async (res) => {
                if (!res.ok) throw new Error(`${res.status}`);
                return res.json();
            })
            .then(setData)
            .catch((e) => setError(String(e)))
            .finally(() => setLoading(false));
    }, [payment.paymentId, isStripe]);

    const KNOWN = new Set(["paymentId", "paymentType", "totalAmount", "amountPaid", "date", "reservations"]);

    return (
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
            {/* DB payment info */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--color-foreground-light)", wordBreak: "break-all" }}>
                    {payment.paymentId}
                </span>
            </div>
            <Field label="Type">{payment.paymentType}</Field>
            <Field label="Date">{fmtDate(payment.date)}</Field>
            <Field label="Total">{fmtCurrency(payment.totalAmount)}</Field>
            <Field label="Amount Paid">{fmtCurrency(payment.amountPaid)}</Field>
            <Field label="Paid">
                <span style={{ color: payment.paid ? "#22c55e" : "var(--color-foreground-light)", fontWeight: 600 }}>
                    {payment.paid ? "Yes" : "No"}
                </span>
            </Field>

            {/* Stripe section */}
            {isStripe && (
                <div style={{ borderTop: "1px solid var(--color-third)", paddingTop: 14, display: "flex", flexDirection: "column", gap: 14 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-foreground-light)" }}>
                        Stripe Data
                    </span>

                    {loading && <p style={{ fontSize: 13, color: "var(--color-foreground-light)" }}>Loading…</p>}
                    {error?.includes("404") && (
                        <p style={{ fontSize: 13, color: "var(--color-foreground-light)" }}>No Stripe record found for this ID.</p>
                    )}
                    {error && !error.includes("404") && (
                        <p style={{ fontSize: 13, color: "var(--color-danger, #ef4444)" }}>{error}</p>
                    )}

                    {data && (() => {
                        const paid = data.amountPaid >= data.totalAmount && data.totalAmount > 0;
                        const extras = Object.entries(data).filter(([k]) => !KNOWN.has(k));
                        return (
                            <>
                                <span style={{
                                    display: "inline-flex", alignSelf: "flex-start",
                                    padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 600,
                                    background: paid ? "color-mix(in srgb, #22c55e 15%, transparent)" : "color-mix(in srgb, var(--color-accent) 15%, transparent)",
                                    color: paid ? "#22c55e" : "var(--color-accent)",
                                }}>
                                    {paid ? "Paid" : "Unpaid"}
                                </span>

                                {extras.map(([k, v]) => (
                                    <Field key={k} label={k}>
                                        {v === null || v === undefined ? "—" : typeof v === "object"
                                            ? <pre style={{ margin: 0, fontSize: 11, whiteSpace: "pre-wrap", fontFamily: "monospace" }}>{JSON.stringify(v, null, 2)}</pre>
                                            : String(v)}
                                    </Field>
                                ))}

                                {data.reservations.length > 0 && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                        <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-foreground-light)" }}>
                                            Reservations ({data.reservations.length})
                                        </span>
                                        {data.reservations.map((r) => {
                                            const RES_SKIP = new Set(["reservationId", "pickUpTime", "dropOffTime", "dateBooked", "car", "user"]);
                                            const carExtra = r.car ? Object.entries(r.car).filter(([k]) => !["vin", "make", "model"].includes(k)) : [];
                                            const userExtra = r.user ? Object.entries(r.user).filter(([k]) => !["userId", "firstName", "lastName"].includes(k)) : [];
                                            const resExtra = Object.entries(r).filter(([k]) => !RES_SKIP.has(k));
                                            return (
                                                <div key={r.reservationId} style={{
                                                    padding: 12, borderRadius: 6,
                                                    background: "var(--color-primary)", border: "1px solid var(--color-third)",
                                                    display: "flex", flexDirection: "column", gap: 6,
                                                }}>
                                                    <span style={{ fontSize: 13, fontWeight: 700 }}>Reservation #{r.reservationId}</span>
                                                    <SubField label="Pick Up">{fmtDate(r.pickUpTime)}</SubField>
                                                    <SubField label="Drop Off">{fmtDate(r.dropOffTime)}</SubField>
                                                    <SubField label="Date Booked">{fmtDate(r.dateBooked)}</SubField>
                                                    {resExtra.map(([k, v]) => <SubField key={k} label={k}>{String(v ?? "—")}</SubField>)}

                                                    {r.car && (
                                                        <div style={{ paddingTop: 4, borderTop: "1px solid var(--color-third)" }}>
                                                            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-foreground-light)", display: "block", marginBottom: 4 }}>Car</span>
                                                            <SubField label="VIN"><span style={{ fontFamily: "monospace" }}>{r.car.vin}</span></SubField>
                                                            <SubField label="Make / Model">{r.car.make} {r.car.model}</SubField>
                                                            {carExtra.map(([k, v]) => (
                                                                <SubField key={k} label={k}>
                                                                    {v === null || v === undefined ? "—" : typeof v === "object"
                                                                        ? <pre style={{ margin: 0, fontSize: 11, whiteSpace: "pre-wrap", fontFamily: "monospace" }}>{JSON.stringify(v, null, 2)}</pre>
                                                                        : String(v)}
                                                                </SubField>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {r.user && (
                                                        <div style={{ paddingTop: 4, borderTop: "1px solid var(--color-third)" }}>
                                                            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-foreground-light)", display: "block", marginBottom: 4 }}>User</span>
                                                            <SubField label="ID">#{r.user.userId}</SubField>
                                                            <SubField label="Name">{r.user.firstName} {r.user.lastName}</SubField>
                                                            {userExtra.map(([k, v]) => (
                                                                <SubField key={k} label={k}>
                                                                    {v === null || v === undefined ? "—" : typeof v === "object"
                                                                        ? <pre style={{ margin: 0, fontSize: 11, whiteSpace: "pre-wrap", fontFamily: "monospace" }}>{JSON.stringify(v, null, 2)}</pre>
                                                                        : String(v)}
                                                                </SubField>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        );
                    })()}
                </div>
            )}
        </div>
    );
}

// ── Columns ───────────────────────────────────────────────────────────────────

const PAYMENT_TYPES = ["CASH", "CREDIT", "DEBIT", "CHECK", "SERVICE", "INVOICE"];

const COLUMNS: Column<Payment>[] = [
    { key: "paymentId",   label: "Payment ID",  defaultVisible: true, locked: true,  render: (p) => <span style={{ fontFamily: "monospace", fontSize: 11 }}>{p.paymentId}</span> },
    { key: "paymentType", label: "Type",        defaultVisible: true, editable: true, editType: "select", editOptions: PAYMENT_TYPES, getValue: (p) => p.paymentType, render: (p) => p.paymentType },
    { key: "totalAmount", label: "Total",       defaultVisible: true, editable: true, editType: "number", getValue: (p) => p.totalAmount, render: (p) => fmtCurrency(p.totalAmount) },
    { key: "amountPaid",  label: "Amount Paid", defaultVisible: true, editable: true, editType: "number", getValue: (p) => p.amountPaid, render: (p) => fmtCurrency(p.amountPaid) },
    { key: "paid",        label: "Paid",        defaultVisible: true, editable: true, editType: "select", editOptions: ["true", "false"], getValue: (p) => String(p.paid), render: (p) => (
        <span style={{ color: p.paid ? "#22c55e" : "var(--color-foreground-light)", fontWeight: 600 }}>
            {p.paid ? "Yes" : "No"}
        </span>
    )},
    { key: "date",        label: "Date",        defaultVisible: true, editable: true, editType: "date", getValue: (p) => {
        const d = new Date(p.date * 1000);
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }, render: (p) => fmtDate(p.date) },
];

// ── Panel ─────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 25;

export default function ViewPaymentsPanel() {
    const { isAdmin, canEdit, canDelete, lockedCols, permanentlyLockedCols } = useTablePermissions("payments");
    const [payments, setPayments] = useState<Payment[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZE);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<Set<string | number>>(new Set());
    const [bulkDeleting, setBulkDeleting] = useState(false);
    const storedFilters = useTablePrefsStore((s) => s.tableFilters[TABLE_TITLE]);
    const storeSetFilters = useTablePrefsStore((s) => s.setTableFilters);
    const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>((storedFilters ?? EMPTY_FILTERS) as ActiveFilter[]);
    const handleFiltersChange = (f: ActiveFilter[]) => { setActiveFilters(f); storeSetFilters(TABLE_TITLE, f); };

    const fetchPage = useCallback(async (p: number, ps = pageSize, filters: ActiveFilter[] = [], isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(p), pageSize: String(ps) });
            Object.entries(filtersToRecord(filters)).forEach(([k, v]) => { if (v !== undefined) params.set(k, String(v)); });
            const res = await fetch(`/api/payments?${params}`, { cache: "no-store" });
            if (!res.ok) throw new Error(`Failed to fetch payments (${res.status})`);
            const data = await res.json();
            setPayments(data?.data ?? data ?? []);
            setTotalPages(data?.totalPages ?? 1);
            setTotalItems(data?.totalItems ?? (data?.data ?? data ?? []).length);
        } catch (e) {
            alert("Failed to load payments: " + e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [pageSize]);

    useEffect(() => { fetchPage(page, pageSize, activeFilters); }, [page, pageSize, fetchPage]);
    useEffect(() => { setPage(1); fetchPage(1, pageSize, activeFilters); }, [activeFilters]);

    const filtered = query
        ? payments.filter((p) =>
              `${p.paymentId} ${p.paymentType} ${p.totalAmount} ${p.amountPaid}`
                  .toLowerCase()
                  .includes(query.toLowerCase()))
        : payments;

    const handleSaveEdits = canEdit ? async (edits: RowEdit<Payment>[]) => {
        try {
            await Promise.all(edits.map(({ id, patch }) => {
                const body = { ...patch };
                if ("paid" in body) body.paid = body.paid === "true";
                return fetch(`/api/payments/${encodeURIComponent(id)}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                }).then((r) => { if (!r.ok) throw new Error(`${r.status}`); });
            }));
            fetchPage(page, pageSize, activeFilters, true);
        } catch (e) { alert("Failed to save edits: " + e); }
    } : undefined;

    const handleDeleteOne = canDelete ? async (payment: Payment) => {
        try {
            const res = await fetch(`/api/payments/${encodeURIComponent(payment.paymentId)}`, { method: "DELETE" });
            if (!res.ok) throw new Error(`${res.status}`);
            fetchPage(page, pageSize, activeFilters, true);
        } catch (e) { alert("Failed to delete payment: " + e); }
    } : undefined;

    const handleBulkDelete = canDelete ? async () => {
        const ids = [...selected] as string[];
        if (!window.confirm(`Delete ${ids.length} payment${ids.length !== 1 ? "s" : ""}? This cannot be undone.`)) return;
        setBulkDeleting(true);
        const results = await Promise.allSettled(ids.map((id) =>
            fetch(`/api/payments/${encodeURIComponent(id)}`, { method: "DELETE" }).then((r) => {
                if (!r.ok) throw new Error(`${r.status}`);
            })
        ));
        const failed = ids.filter((_, i) => results[i].status === "rejected");
        setBulkDeleting(false);
        if (failed.length) alert(`${failed.length} deletion(s) failed.`);
        setSelected(new Set(failed));
        fetchPage(page, pageSize, activeFilters, true);
    } : undefined;

    return (
        <SpreadsheetTable<Payment>
            columns={COLUMNS}
            data={filtered}
            getRowId={(p) => p.paymentId}
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={(p) => { setPage(p); }}
            onPageSizeChange={(ps) => { setPageSize(ps); setPage(1); }}
            loading={loading}
            refreshing={refreshing}
            isAdmin={isAdmin}
            selected={selected}
            onSelectionChange={setSelected}
            bulkDeleting={bulkDeleting}
            onRefresh={() => fetchPage(page, pageSize, activeFilters, true)}
            onSaveEdits={handleSaveEdits}
            onDeleteOne={handleDeleteOne}
            onBulkDelete={handleBulkDelete}
            initialLockedCols={lockedCols}
            permanentlyLockedCols={permanentlyLockedCols}
            filterableColumns={FILTERABLE_COLUMNS}
            activeFilters={activeFilters}
            onFiltersChange={handleFiltersChange}
            title="All Payments"
            subtitle={query ? `${filtered.length} matching on this page` : undefined}
            searchQuery={query}
            onSearchChange={setQuery}
            searchPlaceholder="Filter by ID, type, amount…"
            emptyMessage="No payments found."
            renderPreview={(p) => <PaymentPreview payment={p} />}
        />
    );
}
