"use client";

import { useState, useEffect } from "react";
import { useUserDashboardStore, DashboardPayment } from "@/stores/userDashboardStore";
import { getPaymentsPage, getPaymentsForUser } from "../../actions";
import { BiReceipt, BiDollar, BiCalendar, BiHash, BiChevronLeft, BiChevronRight } from "react-icons/bi";
import styles from "./panels.module.css";

export type { DashboardPayment as Payment };

const PAGE_SIZE = 10;

const fmtDate = (d: number | string | null): string => {
    if (!d) return "—";
    const ms = typeof d === "number" ? d * 1000 : new Date(d).getTime();
    return new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const fmtMoney = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD" });

function parsePayment(p: Record<string, unknown>): DashboardPayment {
    return {
        paymentId:    (p.paymentId ?? p.id ?? "") as string | number,
        totalAmount:  (p.totalAmount as number) ?? 0,
        amountPaid:   (p.amountPaid as number) ?? 0,
        date:         (p.date ?? null) as string | number | null,
        paymentType:  (p.paymentType as string) ?? "",
        paid:         Boolean(p.paid),
        reservations: (p.reservations as number[]) ?? [],
    };
}

function StatusBadge({ paid }: { paid: boolean }) {
    const color = paid
        ? { color: "#15803d", bg: "#dcfce7", border: "#bbf7d0" }
        : { color: "#b45309", bg: "#fef9c3", border: "#fde68a" };
    return (
        <span className={styles.pmtBadge} style={{ color: color.color, background: color.bg, borderColor: color.border }}>
            {paid ? "Paid" : "Pending"}
        </span>
    );
}

// ── Stat cards ─────────────────────────────────────────────────────────────────

interface StatsProps {
    loading: boolean;
    totalPaid: number;
    count: number;
    avgPayment: number;
    lastDate: number | string | null;
}

function StatCards({ loading, totalPaid, count, avgPayment, lastDate }: StatsProps) {
    if (loading) {
        return (
            <div className={styles.pmtStatGrid}>
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className={`${styles.skeleton} ${styles.pmtStatCardSkeleton}`} />
                ))}
            </div>
        );
    }
    return (
        <div className={styles.pmtStatGrid}>
            <div className={styles.pmtStatCard}>
                <div className={styles.pmtStatIcon} style={{ background: "color-mix(in srgb, #22c55e 12%, transparent)" }}>
                    <BiDollar style={{ color: "#22c55e" }} />
                </div>
                <p className={styles.pmtStatLabel}>Total Paid</p>
                <p className={styles.pmtStatValue}>{fmtMoney(totalPaid)}</p>
            </div>
            <div className={styles.pmtStatCard}>
                <div className={styles.pmtStatIcon} style={{ background: "color-mix(in srgb, var(--color-accent) 12%, transparent)" }}>
                    <BiHash style={{ color: "var(--color-accent)" }} />
                </div>
                <p className={styles.pmtStatLabel}>Payments</p>
                <p className={styles.pmtStatValue}>{count}</p>
            </div>
            <div className={styles.pmtStatCard}>
                <div className={styles.pmtStatIcon} style={{ background: "color-mix(in srgb, #f59e0b 12%, transparent)" }}>
                    <BiReceipt style={{ color: "#f59e0b" }} />
                </div>
                <p className={styles.pmtStatLabel}>Average Payment</p>
                <p className={styles.pmtStatValue}>{fmtMoney(avgPayment)}</p>
            </div>
            <div className={styles.pmtStatCard}>
                <div className={styles.pmtStatIcon} style={{ background: "color-mix(in srgb, #3b82f6 12%, transparent)" }}>
                    <BiCalendar style={{ color: "#3b82f6" }} />
                </div>
                <p className={styles.pmtStatLabel}>Most Recent</p>
                <p className={styles.pmtStatValue}>{fmtDate(lastDate)}</p>
            </div>
        </div>
    );
}

// ── List skeleton ─────────────────────────────────────────────────────────────

function ListSkeleton() {
    return (
        <div className={styles.formSection}>
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <div key={i} className={styles.skeletonRow}>
                    <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: "12%", height: 14 }} />
                    <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: "20%", height: 14 }} />
                    <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: "15%", height: 14 }} />
                    <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: "18%", height: 14 }} />
                </div>
            ))}
        </div>
    );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export default function PaymentsPanel() {
    const { stripeUserId } = useUserDashboardStore();

    // List state (first page loads immediately)
    const [listLoading,  setListLoading]  = useState(true);
    const [visible,      setVisible]      = useState<DashboardPayment[]>([]);
    const [page,         setPage]         = useState(1);
    const [totalPages,   setTotalPages]   = useState(1);
    const [totalItems,   setTotalItems]   = useState(0);

    // Stats state (all pages fetched in background)
    const [statsLoading, setStatsLoading] = useState(true);
    const [totalPaid,    setTotalPaid]    = useState(0);
    const [avgPayment,   setAvgPayment]   = useState(0);
    const [lastDate,     setLastDate]     = useState<number | string | null>(null);

    // Initial load: fetch page 1 for the list, all pages in background for stats
    useEffect(() => {
        if (!stripeUserId) return;
        let ignore = false;

        setListLoading(true);
        setStatsLoading(true);
        setPage(1);

        // Page 1 — show the list fast
        getPaymentsPage(stripeUserId, 1, PAGE_SIZE).then(({ payments, totalPages: tp, totalItems: ti }) => {
            if (ignore) return;
            setVisible(payments.map(parsePayment));
            setTotalPages(tp);
            setTotalItems(ti);
            setListLoading(false);
        });

        // All pages — compute stats
        getPaymentsForUser(stripeUserId).then(({ payments: all }) => {
            if (ignore) return;
            const parsed = all.map(parsePayment);
            const total  = parsed.reduce((s, p) => s + p.amountPaid, 0);
            const avg    = parsed.length ? total / parsed.length : 0;
            // newest first by date
            const sorted = [...parsed].sort((a, b) => {
                const ta = a.date ? (typeof a.date === "number" ? a.date : new Date(a.date).getTime() / 1000) : 0;
                const tb = b.date ? (typeof b.date === "number" ? b.date : new Date(b.date).getTime() / 1000) : 0;
                return tb - ta;
            });
            setTotalPaid(total);
            setAvgPayment(avg);
            setLastDate(sorted[0]?.date ?? null);
            setStatsLoading(false);
        });

        return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stripeUserId]);

    // Page changes
    const changePage = async (newPage: number) => {
        if (!stripeUserId) return;
        setListLoading(true);
        const { payments, totalPages: tp } = await getPaymentsPage(stripeUserId, newPage, PAGE_SIZE);
        setVisible(payments.map(parsePayment));
        setTotalPages(tp);
        setPage(newPage);
        setListLoading(false);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className="page-title">Payments</h1>
                <p className="page-subtitle">
                    {statsLoading ? "Loading…" : `${totalItems} payment${totalItems !== 1 ? "s" : ""} on record`}
                </p>
            </div>

            <StatCards
                loading={statsLoading}
                totalPaid={totalPaid}
                count={totalItems}
                avgPayment={avgPayment}
                lastDate={lastDate}
            />

            {listLoading ? (
                <ListSkeleton />
            ) : visible.length === 0 ? (
                <div className={styles.emptyState}>
                    <BiReceipt className={styles.emptyIcon} />
                    <p>No payments found.</p>
                </div>
            ) : (
                <div className={styles.formSection}>
                    <p className={styles.sectionTitle}>
                        <BiReceipt className={styles.sectionIcon} /> All Payments
                    </p>
                    <div className={styles.pmtList}>
                        {visible.map((p) => (
                            <div key={String(p.paymentId)} className={styles.pmtRow}>
                                <div className={styles.pmtRowLeft}>
                                    <p className={styles.pmtRowId}>#{p.paymentId}</p>
                                    <p className={styles.pmtRowDate}>{fmtDate(p.date)}</p>
                                </div>
                                <div className={styles.pmtRowMid}>
                                    {p.paymentType && <span className={styles.pmtRowType}>{p.paymentType}</span>}
                                    {p.reservations.length > 0 && (
                                        <span className={styles.pmtRowRes}>
                                            {p.reservations.length === 1
                                                ? `Reservation #${p.reservations[0]}`
                                                : `${p.reservations.length} reservations`}
                                        </span>
                                    )}
                                </div>
                                <div className={styles.pmtRowRight}>
                                    <StatusBadge paid={p.paid} />
                                    <p className={styles.pmtRowAmount}>{fmtMoney(p.amountPaid)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    {totalPages > 1 && (
                        <div className={styles.resPagination}>
                            <button className={styles.resPageBtn} disabled={page <= 1 || listLoading} onClick={() => changePage(page - 1)}>
                                <BiChevronLeft />
                            </button>
                            <span className={styles.resPageText}>{page} / {totalPages}</span>
                            <button className={styles.resPageBtn} disabled={page >= totalPages || listLoading} onClick={() => changePage(page + 1)}>
                                <BiChevronRight />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
