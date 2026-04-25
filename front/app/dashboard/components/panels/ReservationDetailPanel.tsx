"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useUserDashboardStore, DashboardReservation } from "@/stores/userDashboardStore";
import { deleteReservation, getReviewsForAccount } from "../../actions";
import { Review } from "@/app/types/ReviewTypes";
import ReviewModal from "@/app/components/reviews/ReviewModal";
import { BiCalendar, BiCar, BiCheck, BiChevronLeft, BiEdit, BiFlag, BiPencil, BiReceipt, BiStar, BiTime, BiX } from "react-icons/bi";
import styles from "./panels.module.css";

const toMs = (d: string | number) => typeof d === "number" ? d * 1000 : new Date(d).getTime();

const fmtDate = (d: string | number) =>
    new Date(toMs(d)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const fmtDateTime = (d: string | number) =>
    new Date(toMs(d)).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

type SectionType = "future" | "active" | "past";

function getSectionType(r: DashboardReservation): SectionType {
    const now = Date.now();
    const pick = toMs(r.pickUpTime);
    const drop = toMs(r.dropOffTime);
    if (pick > now) return "future";
    if (drop > now) return "active";
    return "past";
}

const BADGE: Record<SectionType, { label: string; className: string }> = {
    future: { label: "Upcoming",  className: "badgeUpcoming" },
    active: { label: "Active",    className: "badgeActive"   },
    past:   { label: "Completed", className: "badgePast"     },
};

// ── Confirm Cancel Modal ──────────────────────────────────────────────────────

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

// ── Active Rental Section ─────────────────────────────────────────────────────

const REMINDERS = [
    "Return the vehicle with the same fuel level as pick-up.",
    "Inspect the car for any new damage before returning.",
    "Remove all personal belongings from the vehicle.",
    "Return all keys and any included accessories.",
    "Contact us immediately if any incident occurs.",
];

function fmtRemaining(ms: number): string {
    if (ms <= 0) return "Ending soon";
    const days  = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    const mins  = Math.floor((ms % 3600000)  / 60000);
    if (days  > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${mins}m remaining`;
    return `${mins}m remaining`;
}

function ActiveRentalSection({ r, fmtDate, fmtDateTime }: {
    r: DashboardReservation;
    fmtDate: (d: string | number) => string;
    fmtDateTime: (d: string | number) => string;
}) {
    const pickMs  = toMs(r.pickUpTime);
    const dropMs  = toMs(r.dropOffTime);
    const nowMs   = Date.now();
    const total   = dropMs - pickMs;
    const elapsed = Math.max(0, nowMs - pickMs);
    const pct     = Math.min(100, (elapsed / total) * 100);
    const msLeft  = Math.max(0, dropMs - nowMs);

    return (
        <div className={styles.activeSection}>
            {/* Header */}
            <div className={styles.activeSectionHeader}>
                <span className={styles.activePulse} />
                <span className={styles.activeSectionTitle}>Rental in Progress</span>
            </div>

            {/* Progress bar */}
            <div className={styles.activeProgressWrap}>
                <div className={styles.activeProgressTop}>
                    <span className={styles.activeProgressLabel}>{Math.round(pct)}% complete</span>
                    <span className={styles.activeProgressLabel}>{fmtRemaining(msLeft)}</span>
                </div>
                <div className={styles.activeProgressTrack}>
                    <div className={styles.activeProgressFill} style={{ width: `${pct}%` }} />
                </div>
            </div>

            {/* Journey steps */}
            <div className={styles.activeSteps}>
                <div className={`${styles.activeStep} ${styles.activeStepDone}`}>
                    <div className={styles.activeStepIcon}><BiCheck /></div>
                    <div className={styles.activeStepLine} />
                    <p className={styles.activeStepLabel}>Booked</p>
                    <p className={styles.activeStepSub}>{fmtDate(r.dateBooked)}</p>
                </div>
                <div className={`${styles.activeStep} ${styles.activeStepDone}`}>
                    <div className={styles.activeStepIcon}><BiCheck /></div>
                    <div className={styles.activeStepLine} />
                    <p className={styles.activeStepLabel}>Picked Up</p>
                    <p className={styles.activeStepSub}>{fmtDateTime(r.pickUpTime)}</p>
                </div>
                <div className={`${styles.activeStep} ${styles.activeStepCurrent}`}>
                    <div className={styles.activeStepIcon}><BiTime /></div>
                    <div className={styles.activeStepLine} />
                    <p className={styles.activeStepLabel}>Renting</p>
                    <p className={styles.activeStepSub}>Enjoy your drive!</p>
                </div>
                <div className={styles.activeStep}>
                    <div className={styles.activeStepIcon}><BiFlag /></div>
                    <p className={styles.activeStepLabel}>Return</p>
                    <p className={styles.activeStepSub}>{fmtDateTime(r.dropOffTime)}</p>
                </div>
            </div>

            {/* Reminders */}
            <div className={styles.activeReminders}>
                <p className={styles.activeRemindersTitle}>Before You Return</p>
                <ul className={styles.activeRemindersList}>
                    {REMINDERS.map((rem, i) => (
                        <li key={i} className={styles.activeRemindersItem}>
                            <BiCheck className={styles.activeRemindersCheck} />
                            {rem}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

// ── Future Rental Section ─────────────────────────────────────────────────────

function FutureRentalSection({ r, fmtDate, fmtDateTime }: {
    r: DashboardReservation;
    fmtDate: (d: string | number) => string;
    fmtDateTime: (d: string | number) => string;
}) {
    const msUntil   = Math.max(0, toMs(r.pickUpTime) - Date.now());
    const days      = Math.floor(msUntil / 86400000);
    const hours     = Math.floor((msUntil % 86400000) / 3600000);
    const countdown = days > 0 ? `${days}d ${hours}h until pick-up` : hours > 0 ? `${hours}h until pick-up` : "Pick-up is very soon!";

    return (
        <div className={styles.futureSection}>
            <div className={styles.futureSectionHeader}>
                <span className={styles.futureCheck}>✓</span>
                <span className={styles.futureSectionTitle}>Reservation Confirmed</span>
            </div>

            {/* Payment bar */}
            <div className={styles.futurePaymentWrap}>
                <div className={styles.futurePaymentTop}>
                    <span className={styles.futurePaymentLabel}>Payment Completed</span>
                    <span className={styles.futurePaymentLabel}>{countdown}</span>
                </div>
                <div className={styles.futurePaymentTrack}>
                    <div className={styles.futurePaymentFill} />
                </div>
            </div>

            {/* Journey steps */}
            <div className={styles.activeSteps}>
                <div className={`${styles.activeStep} ${styles.activeStepDone}`}>
                    <div className={styles.activeStepIcon}><BiCheck /></div>
                    <div className={styles.activeStepLine} />
                    <p className={styles.activeStepLabel}>Booked</p>
                    <p className={styles.activeStepSub}>{fmtDate(r.dateBooked)}</p>
                </div>
                <div className={`${styles.activeStep} ${styles.activeStepDone}`}>
                    <div className={styles.activeStepIcon}><BiCheck /></div>
                    <div className={styles.activeStepLine} />
                    <p className={styles.activeStepLabel}>Payment</p>
                    <p className={styles.activeStepSub}>Confirmed</p>
                </div>
                <div className={`${styles.activeStep} ${styles.activeStepNext}`}>
                    <div className={styles.activeStepIcon}><BiCar /></div>
                    <div className={styles.activeStepLine} />
                    <p className={styles.activeStepLabel}>Pick Up</p>
                    <p className={styles.activeStepSub}>{fmtDateTime(r.pickUpTime)}</p>
                </div>
                <div className={styles.activeStep}>
                    <div className={styles.activeStepIcon}><BiFlag /></div>
                    <p className={styles.activeStepLabel}>Return</p>
                    <p className={styles.activeStepSub}>{fmtDateTime(r.dropOffTime)}</p>
                </div>
            </div>
        </div>
    );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export default function ReservationDetailPanel() {
    const {
        selectedReservation, setActiveView, openEditReservation,
        accountId, stripeUserId, reservations, setReservations,
    } = useUserDashboardStore();
    const r = selectedReservation;

    const [showCancelModal, setShowCancelModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [reviewTarget, setReviewTarget] = useState<DashboardReservation | null>(null);
    const [userReviews, setUserReviews] = useState<Map<string, Review>>(new Map());

    useEffect(() => {
        if (!accountId) return;
        getReviewsForAccount(accountId)
            .then((data) => {
                const map = new Map<string, Review>();
                data.forEach((rv) => {
                    const vin = typeof rv.car === "string" ? rv.car : (rv.car as { vin: string }).vin;
                    map.set(vin, rv);
                });
                setUserReviews(map);
            })
            .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accountId]);

    if (!r) {
        return (
            <div className={styles.container}>
                <button className={styles.backBtn} onClick={() => setActiveView("reservations")}>
                    <BiChevronLeft /> Back to Reservations
                </button>
                <p className={styles.loading}>No reservation selected.</p>
            </div>
        );
    }

    const sectionType = getSectionType(r);
    const badge = BADGE[sectionType];
    const isPast = sectionType === "past";
    const carName = r.car ? `${r.car.make} ${r.car.model}` : "Unknown Vehicle";
    const existingReview = r.car?.vin ? userReviews.get(r.car.vin) : undefined;

    const handleConfirmCancel = async () => {
        setDeleting(true);
        try {
            await deleteReservation(r.reservationId);
            setReservations(reservations.filter((res) => res.reservationId !== r.reservationId));
            setActiveView("reservations");
        } catch {
            alert("Failed to cancel reservation. Please try again.");
        } finally {
            setDeleting(false);
            setShowCancelModal(false);
        }
    };

    return (
        <>
            {showCancelModal && (
                <ConfirmCancelModal
                    reservation={r}
                    deleting={deleting}
                    onConfirm={handleConfirmCancel}
                    onCancel={() => setShowCancelModal(false)}
                />
            )}

            {reviewTarget && accountId && stripeUserId && (
                <ReviewModal
                    vin={reviewTarget.car?.vin ?? ""}
                    carName={carName}
                    acctId={accountId}
                    userId={stripeUserId}
                    durationDays={reviewTarget.durationDays}
                    existingReview={existingReview}
                    onClose={() => setReviewTarget(null)}
                    onSaved={(saved) => {
                        const vin = typeof saved.car === "string" ? saved.car : (saved.car as { vin: string }).vin;
                        setUserReviews((prev) => new Map(prev).set(vin, saved));
                        setReviewTarget(null);
                    }}
                    onDeleted={() => {
                        const vin = r.car?.vin;
                        if (vin) setUserReviews((prev) => { const m = new Map(prev); m.delete(vin); return m; });
                        setReviewTarget(null);
                    }}
                />
            )}

            <div className={styles.container}>
                {/* Header */}
                <div>
                    <button className={styles.backBtn} onClick={() => setActiveView("reservations")}>
                        <BiChevronLeft /> Back to Reservations
                    </button>
                    <h1 className="page-title">Reservation #{r.reservationId}</h1>
                    <p className="page-subtitle">Booked {fmtDate(r.dateBooked)}</p>
                </div>

                {/* Car hero */}
                <div className={styles.detailHero}>
                    {r.car?.images?.[0] ? (
                        <Image src={r.car.images[0]} alt={carName} fill style={{ objectFit: "cover" }} sizes="800px" />
                    ) : (
                        <div className={styles.detailHeroFallback}>
                            <BiCar className={styles.detailHeroFallbackIcon} />
                        </div>
                    )}
                    <div className={styles.detailHeroOverlay}>
                        <div className={styles.detailHeroMeta}>
                            <p className={styles.detailHeroName}>{carName}</p>
                            {r.car?.vin && <p className={styles.detailHeroVin}>{r.car.vin}</p>}
                        </div>
                        <span className={styles[badge.className as keyof typeof styles]}>{badge.label}</span>
                    </div>
                </div>

                {/* Rental status section */}
                {sectionType === "future" && (
                    <FutureRentalSection r={r} fmtDate={fmtDate} fmtDateTime={fmtDateTime} />
                )}
                {sectionType === "active" && (
                    <ActiveRentalSection r={r} fmtDate={fmtDate} fmtDateTime={fmtDateTime} />
                )}

                {/* Details grid */}
                <div className={styles.formSection}>
                    <p className={styles.sectionTitle}>
                        <BiCalendar className={styles.sectionIcon} /> Reservation Details
                    </p>
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
                                <p className={styles.detailLabel}>Payments</p>
                                <p className={styles.detailValue}>
                                    {r.paymentIds.length > 0
                                        ? `${r.paymentIds.length} payment${r.paymentIds.length !== 1 ? "s" : ""}`
                                        : "None"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                {!isPast && (
                    <div className={styles.actions}>
                        <button className={styles.editBtn} onClick={() => openEditReservation(r)}>
                            <BiEdit /> Edit
                        </button>
                        <button className={styles.cancelBtn} onClick={() => setShowCancelModal(true)}>
                            <BiX /> Cancel
                        </button>
                    </div>
                )}

                {/* Review section (past only) */}
                {isPast && r.car?.vin && (
                    existingReview ? (
                        <div className={styles.reviewCard}>
                            <div className={styles.reviewCardHeader}>
                                <div className={styles.reviewStars}>
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <BiStar
                                            key={i}
                                            className={i < existingReview.stars ? styles.reviewStarFilled : styles.reviewStarEmpty}
                                        />
                                    ))}
                                    <span className={styles.reviewStarCount}>{existingReview.stars}/5</span>
                                </div>
                                <button className={styles.reviewEditBtn} onClick={() => setReviewTarget(r)} title="Edit review">
                                    <BiPencil /> Edit Review
                                </button>
                            </div>
                            <p className={styles.reviewTitle}>{existingReview.title}</p>
                            {existingReview.bodyOfText && (
                                <p className={styles.reviewBody}>{existingReview.bodyOfText}</p>
                            )}
                        </div>
                    ) : (
                        <div className={styles.reviewCard} style={{ alignItems: "center" }}>
                            <p className={styles.reviewNoReview}>You haven&apos;t reviewed this rental yet.</p>
                            <button className={styles.reviewBtn} onClick={() => setReviewTarget(r)}>
                                <BiStar /> Leave a Review
                            </button>
                        </div>
                    )
                )}
            </div>
        </>
    );
}
