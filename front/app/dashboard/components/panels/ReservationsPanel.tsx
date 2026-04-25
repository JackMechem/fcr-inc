"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useUserDashboardStore, DashboardReservation } from "@/stores/userDashboardStore";
import { getAccountById, getCarById, getReviewsForAccount } from "../../actions";
import { Review } from "@/app/types/ReviewTypes";
import ReviewModal from "@/app/components/reviews/ReviewModal";
import { BiCar, BiChevronRight, BiReceipt, BiStar } from "react-icons/bi";
import styles from "./panels.module.css";

const PAGE_SIZE = 5;

const toMs = (d: string | number) => typeof d === "number" ? d * 1000 : new Date(d).getTime();

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
            <div className={styles.resSection}>
                <div className={styles.resSectionHeader}>
                    <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: 60, height: 10 }} />
                </div>
                <div className={styles.resSectionItems}>
                    {Array.from({ length: PAGE_SIZE }, (_, i) => (
                        <div key={i} className={styles.resCardSkeleton}>
                            <div className={`${styles.skeleton} ${styles.skeletonRowThumb}`} style={{ borderRadius: 8, flexShrink: 0 }} />
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
                                <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: "38%" }} />
                                <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: "24%" }} />
                            </div>
                            <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: 68, height: 20, borderRadius: 99 }} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── Section ────────────────────────────────────────────────────────────────────

type SectionType = "future" | "active" | "recent" | "past";

const SECTION_BADGE: Record<SectionType, { label: string; className: string }> = {
    future: { label: "Upcoming",  className: "badgeUpcoming" },
    active: { label: "Active",    className: "badgeActive"   },
    recent: { label: "Completed", className: "badgePast"     },
    past:   { label: "Completed", className: "badgePast"     },
};

function Section({
    title, sectionType, reservations, onOpen, userReviews, onReview,
}: {
    title: string;
    sectionType: SectionType;
    reservations: DashboardReservation[];
    onOpen: (r: DashboardReservation) => void;
    userReviews: Map<string, Review>;
    onReview: (r: DashboardReservation) => void;
}) {
    if (!reservations.length) return null;

    const badge   = SECTION_BADGE[sectionType];
    const isPast  = sectionType === "recent" || sectionType === "past";

    return (
        <div className={styles.resSection}>
            <div className={styles.resSectionHeader}>
                <span className={styles.resSectionLabel}>{title}</span>
                <span className={styles.resSectionCount}>{reservations.length}</span>
            </div>
            <div className={styles.resSectionItems}>
                {reservations.map((r) => {
                    const carName = r.car ? `${r.car.make} ${r.car.model}` : "Unknown Vehicle";
                    const vin = r.car?.vin;
                    const existingReview = vin ? userReviews.get(vin) : undefined;
                    const activePct = sectionType === "active"
                        ? Math.min(100, Math.max(0, ((Date.now() - toMs(r.pickUpTime)) / (toMs(r.dropOffTime) - toMs(r.pickUpTime))) * 100))
                        : 0;

                    return (
                        <div
                            key={r.reservationId}
                            className={`${styles.resCard} ${isPast ? styles.resCardMuted : ""}`}
                            onClick={() => onOpen(r)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === "Enter" && onOpen(r)}
                        >
                            <div className={styles.resCardRow}>
                                <div className={styles.resThumb}>
                                    {r.car?.images?.[0] ? (
                                        <Image src={r.car.images[0]} alt={carName} fill className={styles.rowThumbImg} sizes="56px" />
                                    ) : (
                                        <BiCar className={styles.rowThumbFallback} />
                                    )}
                                </div>

                                <div className={styles.resInfo}>
                                    <p className={styles.resCarName}>{carName}</p>
                                    <p className={styles.resDates}>
                                        {fmtShort(r.pickUpTime)} – {fmtShort(r.dropOffTime)}
                                        <span className={styles.rowDuration}> · {r.durationDays}d</span>
                                    </p>
                                    {isPast && existingReview && (
                                        <span className={styles.resCardStars}>
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <BiStar key={i} className={i < existingReview.stars ? styles.resCardStarFilled : styles.resCardStarEmpty} />
                                            ))}
                                        </span>
                                    )}
                                </div>

                                <div className={styles.resRight}>
                                    {isPast && vin && (
                                        <button
                                            className={`${styles.resReviewBtn} ${existingReview ? styles.resReviewBtnDone : ""}`}
                                            onClick={(e) => { e.stopPropagation(); onReview(r); }}
                                            title={existingReview ? "Edit your review" : "Leave a review"}
                                        >
                                            <BiStar />
                                            {existingReview ? "Reviewed" : "Review"}
                                        </button>
                                    )}
                                    <span className={styles[badge.className as keyof typeof styles]}>{badge.label}</span>
                                    <BiChevronRight className={styles.resChevron} />
                                </div>
                            </div>
                            {sectionType === "active" && (
                                <div className={styles.resCardProgressBar}>
                                    <div className={styles.resCardProgressFill} style={{ width: `${activePct}%` }} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── Panel ──────────────────────────────────────────────────────────────────────

export default function ReservationsPanel() {
    const {
        openReservation, accountId, stripeUserId,
        setUserEmail, setUserName, setReservations: storeSetReservations,
    } = useUserDashboardStore();

    const [loading,      setLoading]      = useState(true);
    const [reservations, setReservations] = useState<DashboardReservation[]>([]);
    const [userReviews,  setUserReviews]  = useState<Map<string, Review>>(new Map());
    const [reviewTarget, setReviewTarget] = useState<DashboardReservation | null>(null);

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
        if (!accountId) return;
        setLoading(true);
        getAccountById(accountId, { parseFullObjects: true })
            .then(async (account) => {
                if (account.email) setUserEmail(account.email as string);
                if (account.name)  setUserName(account.name as string);
                const user = account.user as Record<string, unknown> | null;
                const raw = ((user?.reservations ?? []) as Record<string, unknown>[]);
                if (!raw.length) { setReservations([]); storeSetReservations([]); setLoading(false); return; }

                const vins = [...new Set(raw.map((r) => r.car as string).filter(Boolean))];
                const carResults = await Promise.all(
                    vins.map((vin) => getCarById(vin).catch(() => null))
                );
                const carMap = new Map<string, Record<string, unknown>>();
                carResults.forEach((car) => { if (car) carMap.set(car.vin, car as unknown as Record<string, unknown>); });

                const mapped = raw.map((r) => {
                    const vin = r.car as string;
                    const car = carMap.get(vin) ?? null;
                    return {
                        ...r,
                        car: car ? { vin: car.vin as string, make: car.make as string, model: car.model as string, images: (car.images as string[]) ?? [] } : null,
                        paymentIds: (r.payments as string[]) ?? [],
                    } as DashboardReservation;
                });
                setReservations(mapped);
                storeSetReservations(mapped);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accountId]);

    useEffect(() => {
        if (accountId) fetchUserReviews(accountId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accountId]);

    if (loading) return <ReservationsSkeleton />;

    const nowMs      = Date.now();
    const threeWeeks = 3 * 7 * 24 * 60 * 60 * 1000;

    const future = reservations
        .filter((r) => toMs(r.pickUpTime) > nowMs)
        .sort((a, b) => toMs(a.pickUpTime) - toMs(b.pickUpTime));

    const active = reservations
        .filter((r) => toMs(r.pickUpTime) <= nowMs && toMs(r.dropOffTime) > nowMs)
        .sort((a, b) => toMs(a.dropOffTime) - toMs(b.dropOffTime));

    const recent = reservations
        .filter((r) => toMs(r.dropOffTime) <= nowMs && toMs(r.dropOffTime) >= nowMs - threeWeeks)
        .sort((a, b) => toMs(b.dropOffTime) - toMs(a.dropOffTime));

    const past = reservations
        .filter((r) => toMs(r.dropOffTime) < nowMs - threeWeeks)
        .sort((a, b) => toMs(b.dropOffTime) - toMs(a.dropOffTime));

    const sharedProps = { userReviews, onReview: setReviewTarget, onOpen: openReservation };

    return (
        <>
            {reviewTarget && accountId && stripeUserId && (
                <ReviewModal
                    vin={reviewTarget.car?.vin ?? ""}
                    carName={reviewTarget.car ? `${reviewTarget.car.make} ${reviewTarget.car.model}` : "Unknown Vehicle"}
                    acctId={accountId}
                    userId={stripeUserId}
                    durationDays={reviewTarget.durationDays}
                    existingReview={reviewTarget.car?.vin ? userReviews.get(reviewTarget.car.vin) : undefined}
                    onClose={() => setReviewTarget(null)}
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
                        <Section title="Future" sectionType="future" reservations={future} {...sharedProps} />
                        <Section title="Active" sectionType="active" reservations={active} {...sharedProps} />
                        <Section title="Recent" sectionType="recent" reservations={recent} {...sharedProps} />
                        <Section title="Past"   sectionType="past"   reservations={past}   {...sharedProps} />
                    </>
                )}
            </div>
        </>
    );
}
