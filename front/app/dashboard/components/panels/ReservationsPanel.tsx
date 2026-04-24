"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useUserDashboardStore, DashboardReservation } from "@/stores/userDashboardStore";
import { getAccountById, getCarById, getReviewsForAccount, deleteReservation } from "../../actions";
import { BiCalendar, BiCar, BiReceipt, BiTime, BiEdit, BiX, BiStar, BiChevronDown } from "react-icons/bi";
import { Review } from "@/app/types/ReviewTypes";
import ReviewModal from "@/app/components/reviews/ReviewModal";
import styles from "./panels.module.css";

const PAGE_SIZE = 5;

const toMs = (d: string | number) => typeof d === "number" ? d * 1000 : new Date(d).getTime();

const fmtDate = (d: string | number) =>
    new Date(toMs(d)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const fmtDateTime = (d: string | number) =>
    new Date(toMs(d)).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

const fmtShort = (d: string | number) =>
    new Date(toMs(d)).toLocaleDateString("en-US", { month: "short", day: "numeric" });

// ── Skeleton ───────────────────────────────────────────────────────────────────

function ReservationsSkeleton() {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
                <div className={`${styles.skeleton} ${styles.skeletonSubtitle}`} />
            </div>
            <div className={styles.listGroup}>
                <div className={styles.listGroupHeader}>
                    <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: 90 }} />
                </div>
                {Array.from({ length: PAGE_SIZE }, (_, i) => (
                    <div key={i} className={`${styles.listRow} ${i < PAGE_SIZE - 1 ? styles.listRowBorder : ""}`} style={{ pointerEvents: "none" }}>
                        <div className={styles.listRowSummary} style={{ cursor: "default" }}>
                            <div className={`${styles.skeleton} ${styles.skeletonRowThumb}`} />
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
                                <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: "40%" }} />
                                <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: "26%" }} />
                            </div>
                            <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: 72, height: 22, borderRadius: 99 }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Confirm Cancel Modal ───────────────────────────────────────────────────────

interface ConfirmModalProps {
    reservation: DashboardReservation;
    deleting: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

function ConfirmCancelModal({ reservation, deleting, onConfirm, onCancel }: ConfirmModalProps) {
    return (
        <div className={styles.modalOverlay} onClick={onCancel}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <p className={styles.modalTitle}>Cancel Reservation?</p>
                <p className={styles.modalBody}>
                    You are about to cancel <strong>Reservation #{reservation.reservationId}</strong>
                    {reservation.car ? ` for the ${reservation.car.make} ${reservation.car.model}` : ""}.
                    This action cannot be undone.
                </p>
                <p className={styles.modalWarning}>No refunds will be issued for canceled reservations.</p>
                <div className={styles.modalActions}>
                    <button className={styles.modalCancelBtn} onClick={onCancel} disabled={deleting}>Keep Reservation</button>
                    <button className={styles.modalConfirmBtn} onClick={onConfirm} disabled={deleting}>
                        {deleting ? "Canceling…" : "Yes, Cancel"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Section ────────────────────────────────────────────────────────────────────

function Section({
    title, count, isPast, reservations, expandedId, onToggle, userReviews,
    onEdit, onCancel, onReview,
}: {
    title: string;
    count: number;
    isPast: boolean;
    reservations: DashboardReservation[];
    expandedId: number | null;
    onToggle: (id: number) => void;
    userReviews: Map<string, Review>;
    onEdit: (r: DashboardReservation) => void;
    onCancel: (r: DashboardReservation) => void;
    onReview: (r: DashboardReservation) => void;
}) {
    if (!reservations.length) return null;

    return (
        <div className={`${styles.listGroup} ${isPast ? styles.listGroupPast : ""}`}>
            <div className={styles.listGroupHeader}>
                <span className={styles.listGroupTitle}>{title}</span>
                <span className={styles.listGroupCount}>{count}</span>
            </div>

            {reservations.map((r, idx) => {
                const vin = r.car?.vin ?? "";
                const carName = r.car ? `${r.car.make} ${r.car.model}` : "Unknown Vehicle";
                const existingReview = vin ? userReviews.get(vin) : undefined;
                const isExpanded = expandedId === r.reservationId;
                const isLast = idx === reservations.length - 1;

                return (
                    <div key={r.reservationId} className={`${styles.listRow} ${isExpanded ? styles.listRowExpanded : ""} ${!isLast ? styles.listRowBorder : ""}`}>
                        {/* Summary row — always visible */}
                        <button
                            className={styles.listRowSummary}
                            onClick={() => onToggle(r.reservationId)}
                        >
                            <div className={styles.rowThumb}>
                                {r.car?.images?.[0] ? (
                                    <Image src={r.car.images[0]} alt={carName} fill className={styles.rowThumbImg} sizes="52px" />
                                ) : (
                                    <BiCar className={styles.rowThumbFallback} />
                                )}
                            </div>

                            <div className={styles.rowInfo}>
                                <p className={styles.rowCarName}>{carName}</p>
                                <p className={styles.rowDateRange}>
                                    {fmtShort(r.pickUpTime)} – {fmtShort(r.dropOffTime)}
                                    <span className={styles.rowDuration}> · {r.durationDays}d</span>
                                </p>
                            </div>

                            <div className={styles.rowRight}>
                                {isPast
                                    ? <span className={styles.badgePast}>Completed</span>
                                    : <span className={styles.badgeUpcoming}>Upcoming</span>
                                }
                                <BiChevronDown className={`${styles.rowChevron} ${isExpanded ? styles.rowChevronOpen : ""}`} />
                            </div>
                        </button>

                        {/* Expanded detail panel */}
                        {isExpanded && (
                            <div className={styles.rowDetail}>
                                <div className={styles.detailGrid}>
                                    <div className={styles.detailItem}>
                                        <BiCalendar className={styles.detailIcon} />
                                        <div>
                                            <p className={styles.detailLabel}>Pick Up</p>
                                            <p className={styles.detailValue}>{fmtDateTime(r.pickUpTime)}</p>
                                        </div>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <BiCalendar className={styles.detailIcon} />
                                        <div>
                                            <p className={styles.detailLabel}>Drop Off</p>
                                            <p className={styles.detailValue}>{fmtDateTime(r.dropOffTime)}</p>
                                        </div>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <BiTime className={styles.detailIcon} />
                                        <div>
                                            <p className={styles.detailLabel}>Duration</p>
                                            <p className={styles.detailValue}>{r.durationDays} day{r.durationDays !== 1 ? "s" : ""}</p>
                                        </div>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <BiReceipt className={styles.detailIcon} />
                                        <div>
                                            <p className={styles.detailLabel}>Reservation</p>
                                            <p className={styles.detailValue}>#{r.reservationId} · Booked {fmtDate(r.dateBooked)}</p>
                                        </div>
                                    </div>
                                </div>

                                {vin && <p className={styles.detailVin}>{vin}</p>}

                                <div className={styles.actions}>
                                    {!isPast && (
                                        <>
                                            <button className={styles.editBtn} onClick={() => onEdit(r)}>
                                                <BiEdit /> Edit
                                            </button>
                                            <button className={styles.cancelBtn} onClick={() => onCancel(r)}>
                                                <BiX /> Cancel
                                            </button>
                                        </>
                                    )}
                                    {isPast && vin && (
                                        <button className={styles.reviewBtn} onClick={() => onReview(r)}>
                                            <BiStar /> {existingReview ? "Edit Review" : "Leave a Review"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ── Panel ──────────────────────────────────────────────────────────────────────

export default function ReservationsPanel() {
    const { openEditReservation, accountId, stripeUserId, setUserEmail, setUserName } = useUserDashboardStore();

    const [loading, setLoading] = useState(true);
    const [reservations, setReservations] = useState<DashboardReservation[]>([]);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [pendingCancel, setPendingCancel] = useState<DashboardReservation | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [userReviews, setUserReviews] = useState<Map<string, Review>>(new Map());
    const [reviewTarget, setReviewTarget] = useState<DashboardReservation | null>(null);

    useEffect(() => {
        if (!accountId) return;
        setLoading(true);
        getAccountById(accountId, { parseFullObjects: true })
            .then(async (account) => {
                if (account.email) setUserEmail(account.email as string);
                if (account.name)  setUserName(account.name as string);
                const user = account.user as Record<string, unknown> | null;
                const raw = ((user?.reservations ?? []) as Record<string, unknown>[]);
                if (!raw.length) { setReservations([]); setLoading(false); return; }

                const vins = [...new Set(raw.map((r) => r.car as string).filter(Boolean))];
                const carResults = await Promise.all(
                    vins.map((vin) => getCarById(vin).catch(() => null))
                );
                const carMap = new Map<string, Record<string, unknown>>();
                carResults.forEach((car) => { if (car) carMap.set(car.vin, car as unknown as Record<string, unknown>); });

                setReservations(raw.map((r) => {
                    const vin = r.car as string;
                    const car = carMap.get(vin) ?? null;
                    return {
                        ...r,
                        car: car ? { vin: car.vin as string, make: car.make as string, model: car.model as string, images: (car.images as string[]) ?? [] } : null,
                        paymentIds: (r.payments as string[]) ?? [],
                    } as DashboardReservation;
                }));
                setLoading(false);
            })
            .catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accountId]);

    const fetchUserReviews = (acctId: number) => {
        getReviewsForAccount(acctId)
            .then((data) => {
                const map = new Map<string, Review>();
                data.forEach((rv) => {
                    const vin = typeof rv.car === "string" ? rv.car : (rv.car as { vin: string }).vin;
                    map.set(vin, rv);
                });
                setUserReviews(map);
            })
            .catch(() => {});
    };

    useEffect(() => {
        if (accountId) fetchUserReviews(accountId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accountId]);

    const handleConfirmCancel = async () => {
        if (!pendingCancel) return;
        setDeleting(true);
        try {
            await deleteReservation(pendingCancel.reservationId);
            setReservations((prev) => prev.filter((r) => r.reservationId !== pendingCancel.reservationId));
            setPendingCancel(null);
        } catch {
            alert("Failed to cancel reservation. Please try again.");
        } finally {
            setDeleting(false);
        }
    };

    const toggleExpanded = (id: number) =>
        setExpandedId((prev) => (prev === id ? null : id));

    if (loading) return <ReservationsSkeleton />;

    const nowMs = Date.now();
    const upcoming = reservations.filter((r) => toMs(r.dropOffTime) >= nowMs);
    const past     = reservations.filter((r) => toMs(r.dropOffTime) <  nowMs);

    return (
        <>
            {pendingCancel && (
                <ConfirmCancelModal
                    reservation={pendingCancel}
                    deleting={deleting}
                    onConfirm={handleConfirmCancel}
                    onCancel={() => setPendingCancel(null)}
                />
            )}

            {reviewTarget && accountId && stripeUserId && (
                <ReviewModal
                    vin={reviewTarget.car?.vin ?? ""}
                    carName={reviewTarget.car ? `${reviewTarget.car.make} ${reviewTarget.car.model}` : "Unknown Vehicle"}
                    acctId={accountId}
                    userId={stripeUserId}
                    durationDays={reviewTarget.durationDays}
                    existingReview={reviewTarget.car?.vin ? userReviews.get(reviewTarget.car.vin) : undefined}
                    onClose={() => { setReviewTarget(null); fetchUserReviews(accountId); }}
                    onSaved={(saved) => {
                        const vin = typeof saved.car === "string" ? saved.car : (saved.car as { vin: string }).vin;
                        setUserReviews((prev) => new Map(prev).set(vin, saved));
                        setReviewTarget(null);
                        fetchUserReviews(accountId);
                    }}
                    onDeleted={() => {
                        const vin = reviewTarget.car?.vin;
                        if (vin) setUserReviews((prev) => { const m = new Map(prev); m.delete(vin); return m; });
                        setReviewTarget(null);
                    }}
                />
            )}

            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className="page-title">Reservations</h1>
                    <p className="page-subtitle">{reservations.length} reservation{reservations.length !== 1 ? "s" : ""}</p>
                </div>

                {reservations.length === 0 ? (
                    <div className={styles.emptyState}>
                        <BiReceipt className={styles.emptyIcon} />
                        <p>No reservations found.</p>
                    </div>
                ) : (
                    <>
                        <Section
                            title="Upcoming"
                            count={upcoming.length}
                            isPast={false}
                            reservations={upcoming}
                            expandedId={expandedId}
                            onToggle={toggleExpanded}
                            userReviews={userReviews}
                            onEdit={openEditReservation}
                            onCancel={setPendingCancel}
                            onReview={setReviewTarget}
                        />
                        <Section
                            title="Past"
                            count={past.length}
                            isPast={true}
                            reservations={past}
                            expandedId={expandedId}
                            onToggle={toggleExpanded}
                            userReviews={userReviews}
                            onEdit={openEditReservation}
                            onCancel={setPendingCancel}
                            onReview={setReviewTarget}
                        />
                    </>
                )}
            </div>
        </>
    );
}
