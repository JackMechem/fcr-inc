"use client";

import { useState } from "react";
import Field, { formStyles as styles } from "../form/Field";
import SectionCard from "../form/SectionCard";
import { BiPlus, BiX, BiSearch } from "react-icons/bi";
import { getAccounts } from "../../actions";
import { Account } from "@/app/lib/fcr-client";
import { Reservation } from "@/app/types/ReservationTypes";

// ── Types ─────────────────────────────────────────────────────────────────────

interface LineItem {
    id: number;
    description: string;
    amount: string;
}

interface InvoiceResult {
    invoiceId: string;
    status: string;
    hostedInvoiceUrl: string;
    invoicePdf: string;
    totalAmount: number;
}

const getUserId = (user: Reservation["user"]): number | null =>
    typeof user === "object" ? user.userId : user ?? null;

const getCarLabel = (car: Reservation["car"]): string =>
    typeof car === "object"
        ? `${(car as { make?: string }).make ?? ""} ${(car as { model?: string }).model ?? ""}`.trim() || car.vin
        : String(car);

const fmtDate = (epoch: number) =>
    new Date(epoch * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

// ── Panel ─────────────────────────────────────────────────────────────────────

let nextId = 1;

export default function CreateInvoicePanel() {
    // Account search
    const [accountQuery, setAccountQuery] = useState("");
    const [accountResults, setAccountResults] = useState<Account[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

    // Reservations
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loadingRes, setLoadingRes] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

    // Form
    const [email, setEmail] = useState("");
    const [items, setItems] = useState<LineItem[]>([{ id: nextId++, description: "", amount: "" }]);
    const [daysUntilDue, setDaysUntilDue] = useState(30);

    // Submit
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<InvoiceResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const searchAccounts = async () => {
        if (!accountQuery.trim()) return;
        setSearching(true);
        setAccountResults([]);
        try {
            const res = await getAccounts({ search: accountQuery.trim(), pageSize: 10 });
            setAccountResults(res.data ?? []);
        } catch (e) { setError(String(e)); }
        finally { setSearching(false); }
    };

    const selectAccount = async (a: Account) => {
        setSelectedAccount(a);
        setAccountResults([]);
        setAccountQuery("");
        setEmail(a.email);
        setSelectedReservation(null);
        setReservations([]);

        if (a.user == null) return;
        setLoadingRes(true);
        try {
            const res = await fetch(`/api/reservations?pageSize=200`, { cache: "no-store" });
            if (!res.ok) throw new Error(`${res.status}`);
            const data = await res.json();
            const all: Reservation[] = data?.data ?? data ?? [];
            setReservations(all.filter((r) => getUserId(r.user) === a.user));
        } catch { /* reservations optional */ }
        finally { setLoadingRes(false); }
    };

    const clearAccount = () => {
        setSelectedAccount(null);
        setEmail("");
        setReservations([]);
        setSelectedReservation(null);
    };

    const addItem = () => setItems((prev) => [...prev, { id: nextId++, description: "", amount: "" }]);
    const removeItem = (id: number) => setItems((prev) => prev.length > 1 ? prev.filter((i) => i.id !== id) : prev);
    const updateItem = (id: number, field: keyof Omit<LineItem, "id">, value: string) =>
        setItems((prev) => prev.map((i) => i.id === id ? { ...i, [field]: value } : i));
    const total = items.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);

    const handleSubmit = async () => {
        if (!email.trim()) { setError("Email is required."); return; }
        if (!selectedReservation) { setError("Select a reservation."); return; }
        const validItems = items.filter((i) => i.description.trim() && parseFloat(i.amount) > 0);
        if (validItems.length === 0) { setError("Add at least one line item with a description and amount."); return; }

        setSubmitting(true);
        setError(null);
        setResult(null);
        try {
            const res = await fetch("/api/payments/invoice", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: email.trim(),
                    reservationId: selectedReservation.reservationId,
                    items: validItems.map((i) => ({ description: i.description.trim(), amount: parseFloat(i.amount) })),
                    daysUntilDue,
                }),
            });
            if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
            setResult(await res.json());
            clearAccount();
            setItems([{ id: nextId++, description: "", amount: "" }]);
            setDaysUntilDue(30);
        } catch (e) {
            setError(String(e));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.formRoot} style={{ maxWidth: 600 }}>

            {/* Customer */}
            <SectionCard title="Customer">
                {selectedAccount ? (
                    <div style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "10px 14px", borderRadius: "0.75rem",
                        border: "1px solid color-mix(in srgb, var(--color-accent) 40%, transparent)",
                        background: "color-mix(in srgb, var(--color-accent) 6%, transparent)",
                    }}>
                        <div>
                            <p style={{ fontSize: "10.5pt", fontWeight: 600, color: "var(--color-foreground)" }}>{selectedAccount.name || selectedAccount.email}</p>
                            <p style={{ fontSize: "10pt", color: "var(--color-foreground-light)" }}>{selectedAccount.email} · #{selectedAccount.acctId}</p>
                        </div>
                        <button onClick={clearAccount} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-foreground-light)", fontSize: 18 }}>
                            <BiX />
                        </button>
                    </div>
                ) : (
                    <Field label="Search by name or email">
                        <div style={{ display: "flex", gap: 8 }}>
                            <input
                                className={styles.input}
                                style={{ flex: 1 }}
                                placeholder="Name or email…"
                                value={accountQuery}
                                onChange={(e) => setAccountQuery(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && searchAccounts()}
                            />
                            <button onClick={searchAccounts} disabled={searching} style={{
                                display: "flex", alignItems: "center", gap: 4,
                                padding: "8px 12px", borderRadius: "0.75rem",
                                border: "1px solid var(--color-third)", background: "none",
                                color: "var(--color-foreground-light)", fontSize: "10pt",
                                fontWeight: 600, cursor: "pointer", flexShrink: 0,
                            }}>
                                <BiSearch /> {searching ? "Searching…" : "Search"}
                            </button>
                        </div>
                    </Field>
                )}

                {accountResults.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {accountResults.map((a) => (
                            <button key={a.acctId} onClick={() => selectAccount(a)} style={{
                                textAlign: "left", padding: "10px 14px", borderRadius: "0.75rem",
                                border: "1px solid var(--color-third)", background: "var(--color-primary)",
                                color: "var(--color-foreground)", cursor: "pointer",
                            }}>
                                <span style={{ fontWeight: 600, fontSize: "10.5pt" }}>{a.name || "—"}</span>
                                <span style={{ color: "var(--color-foreground-light)", fontSize: "10pt", marginLeft: 8 }}>{a.email}</span>
                                <span style={{ color: "var(--color-foreground-light)", fontSize: "9pt", marginLeft: 8 }}>#{a.acctId}</span>
                            </button>
                        ))}
                    </div>
                )}

                <Field label="Email">
                    <input
                        className={styles.input}
                        style={{ width: "100%" }}
                        type="email"
                        placeholder="customer@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </Field>
            </SectionCard>

            {/* Reservation */}
            <SectionCard title="Reservation">
                {loadingRes && (
                    <p style={{ fontSize: "10pt", color: "var(--color-foreground-light)" }}>Loading reservations…</p>
                )}
                {!loadingRes && !selectedAccount && (
                    <p style={{ fontSize: "10pt", color: "var(--color-foreground-light)" }}>Search for a customer above to see their reservations.</p>
                )}
                {!loadingRes && selectedAccount && reservations.length === 0 && (
                    <p style={{ fontSize: "10pt", color: "var(--color-foreground-light)" }}>No reservations found for this account.</p>
                )}
                {!loadingRes && reservations.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {reservations.map((r) => {
                            const selected = selectedReservation?.reservationId === r.reservationId;
                            return (
                                <button key={r.reservationId} onClick={() => setSelectedReservation(selected ? null : r)} style={{
                                    textAlign: "left", padding: "10px 14px", borderRadius: "0.75rem", cursor: "pointer",
                                    border: `1px solid ${selected ? "var(--color-accent)" : "var(--color-third)"}`,
                                    background: selected ? "color-mix(in srgb, var(--color-accent) 8%, transparent)" : "var(--color-primary)",
                                    color: "var(--color-foreground)",
                                }}>
                                    <span style={{ fontWeight: 600, fontSize: "10.5pt" }}>#{r.reservationId}</span>
                                    <span style={{ color: "var(--color-foreground-light)", fontSize: "10pt", marginLeft: 8 }}>
                                        {getCarLabel(r.car)} · {fmtDate(r.pickUpTime)} – {fmtDate(r.dropOffTime)}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </SectionCard>

            {/* Line items */}
            <SectionCard title="Line Items" action={
                <button onClick={addItem} style={{
                    display: "flex", alignItems: "center", gap: 4, padding: "6px 10px",
                    borderRadius: "0.5rem", border: "1px solid var(--color-third)", background: "none",
                    color: "var(--color-foreground-light)", fontSize: "9pt", fontWeight: 600, cursor: "pointer",
                }}>
                    <BiPlus style={{ fontSize: 13 }} /> Add Item
                </button>
            }>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 130px 36px", gap: 8 }}>
                    <span className={styles.label} style={{ marginBottom: 0 }}>Description</span>
                    <span className={styles.label} style={{ marginBottom: 0 }}>Amount</span>
                    <span />
                </div>
                {items.map((item) => (
                    <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr 130px 36px", gap: 8, alignItems: "center" }}>
                        <input className={styles.input} placeholder="e.g. Car rental deposit"
                            value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)} />
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: "10pt", color: "var(--color-foreground-light)" }}>$</span>
                            <input className={styles.input} style={{ width: "100%", minWidth: 0 }}
                                type="number" min={0} step={0.01} placeholder="0.00"
                                value={item.amount} onChange={(e) => updateItem(item.id, "amount", e.target.value)} />
                        </div>
                        <button onClick={() => removeItem(item.id)} disabled={items.length === 1}
                            className={styles.imageRemoveBtn} style={{ opacity: items.length === 1 ? 0.25 : 1 }}>
                            <BiX />
                        </button>
                    </div>
                ))}
                <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid color-mix(in srgb, var(--color-third) 50%, transparent)", paddingTop: 10 }}>
                    <span style={{ fontSize: "10.5pt", fontWeight: 600, color: "var(--color-foreground)" }}>
                        Total: ${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>
            </SectionCard>

            {/* Options */}
            <SectionCard title="Options">
                <Field label="Days Until Due">
                    <input className={styles.input} style={{ width: 100 }} type="number" min={1}
                        value={daysUntilDue} onChange={(e) => setDaysUntilDue(Number(e.target.value))} />
                </Field>
            </SectionCard>

            {error && <p style={{ fontSize: "9.5pt", color: "#ef4444" }}>{error}</p>}

            <button className={styles.submitBtn} onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Sending…" : "Send Invoice"}
            </button>

            {result && (
                <div className={styles.sectionCard} style={{ borderColor: "#22c55e" }}>
                    <div className={styles.sectionCardHeader}>
                        <p className={styles.sectionCardTitle} style={{ color: "#22c55e" }}>Invoice Sent</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {([
                            ["Invoice ID", <span style={{ fontFamily: "monospace", fontSize: "9.5pt" }}>{result.invoiceId}</span>],
                            ["Status",     <span style={{ textTransform: "capitalize" }}>{result.status}</span>],
                            ["Total",      <strong>${result.totalAmount.toFixed(2)}</strong>],
                        ] as [string, React.ReactNode][]).map(([k, v]) => (
                            <div key={k} style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
                                <span className={styles.label} style={{ marginBottom: 0, minWidth: 90 }}>{k}</span>
                                <span style={{ fontSize: "10.5pt", color: "var(--color-foreground)" }}>{v}</span>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
                        <a href={result.hostedInvoiceUrl} target="_blank" rel="noreferrer"
                            style={{ padding: "8px 14px", borderRadius: "0.75rem", background: "var(--color-accent)", color: "#fff", fontSize: "9.5pt", fontWeight: 600, textDecoration: "none" }}>
                            View Invoice
                        </a>
                        <a href={result.invoicePdf} target="_blank" rel="noreferrer"
                            style={{ padding: "8px 14px", borderRadius: "0.75rem", border: "1px solid var(--color-third)", background: "none", color: "var(--color-foreground)", fontSize: "9.5pt", fontWeight: 600, textDecoration: "none" }}>
                            Download PDF
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
