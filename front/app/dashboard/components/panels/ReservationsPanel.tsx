"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useUserDashboardStore, DashboardReservation, DashboardPayment } from "@/stores/userDashboardStore";
import { getReservationPage, getReviewsForAccount } from "../../actions";
import { Review } from "@/app/types/ReviewTypes";
import ReviewModal from "@/app/components/reviews/ReviewModal";
import { BiCar, BiChevronLeft, BiChevronRight, BiReceipt, BiStar } from "react-icons/bi";
import styles from "./panels.module.css";

const PAGE_SIZE = 10;
const SKELETON_SIZE = PAGE_SIZE;

const toMs = (d: string | number) => typeof d === "number" ? d * 1000 : new Date(d).getTime();

const fmtShort = (d: string | number) =>
    new Date(toMs(d)).toLocaleDateString("en-US", { month: "short", day: "numeric" });

// ── Parsers ────────────────────────────────────────────────────────────────────

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

function parseCar(c: Record<string, unknown>): DashboardReservation["car"] {
    if (!c || typeof c !== "object") return null;
    return {
        vin:    (c.vin as string) ?? "",
        make:   (c.make as string) ?? "",
        model:  (c.model as string) ?? "",
        images: (c.images as string[]) ?? [],
    };
}

function parseReservation(r: Record<string, unknown>): DashboardReservation {
    const carRaw  = r.car as Record<string, unknown> | null;
    const pmtsRaw = (r.payments ?? []) as Record<string, unknown>[];
    return {
        reservationId: r.reservationId as number,
        car:           carRaw ? parseCar(carRaw) : null,
        user:          r.user as number,
        payments:      pmtsRaw.map(parsePayment),
        pickUpTime:    r.pickUpTime as number | string,
        dropOffTime:   r.dropOffTime as number | string,
        dateBooked:    r.dateBooked as number | string,
        duration:      (r.duration as number) ?? 0,
        durationHours: (r.durationHours as number) ?? 0,
        durationDays:  (r.durationDays as number) ?? 0,
    };
}

// ── Skeletons ──────────────────────────────────────────────────────────────────

function CardSkeletons({ count = SKELETON_SIZE }: { count?: number }) {
    return (
        <>
            {Array.from({ length: count }, (_, i) => (
                <div key={i} className={styles.resCardSkeleton}>
                    <div className={`${styles.skeleton} ${styles.skeletonRowThumb}`} style={{ borderRadius: 8, flexShrink: 0 }} />
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
                        <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: "38%" }} />
                        <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: "24%" }} />
                    </div>
                    <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: 68, height: 20, borderRadius: 99 }} />
                </div>
            ))}
        </>
    );
}

function FullSkeleton() {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
                <div className={`${styles.skeleton} ${styles.skeletonSubtitle}`} />
            </div>
            <div className={styles.resSection}>
                <div className={styles.resSectionItems}><CardSkeletons /></div>
            </div>
        </div>
    );
}

// ── Reservation card (shared) ──────────────────────────────────────────────────

type SectionType = "future" | "active" | "recent" | "past";

const BADGE: Record<SectionType, { label: string; className: string }> = {
    future: { label: "Upcoming",  className: "badgeUpcoming" },
    active: { label: "Active",    className: "badgeActive"   },
    recent: { label: "Completed", className: "badgePast"     },
    past:   { label: "Completed", className: "badgePast"     },
};

function getSectionType(r: DashboardReservation): SectionType {
    const now = Date.now();
    if (toMs(r.pickUpTime) > now) return "future";
    if (toMs(r.dropOffTime) > now) return "active";
    return "past";
}

function ResCard({ r, onOpen, userReviews, onReview, sectionType }: {
    r: DashboardReservation;
    onOpen: (r: DashboardReservation) => void;
    userReviews: Map<string, Review>;
    onReview: (r: DashboardReservation) => void;
    sectionType: SectionType;
}) {
    const carName = r.car ? `${r.car.make} ${r.car.model}` : "Unknown Vehicle";
    const vin = r.car?.vin;
    const existingReview = vin ? userReviews.get(vin) : undefined;
    const isPast = sectionType === "recent" || sectionType === "past";
    const badge  = BADGE[sectionType];
    const activePct = sectionType === "active"
        ? Math.min(100, Math.max(0, ((Date.now() - toMs(r.pickUpTime)) / (toMs(r.dropOffTime) - toMs(r.pickUpTime))) * 100))
        : 0;

    return (
        <div
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
}

// ── Categorised section ────────────────────────────────────────────────────────

function Section({
    title, sectionType, reservations, loading,
    page, totalPages, onPageChange,
    onOpen, userReviews, onReview,
}: {
    title: string;
    sectionType: SectionType;
    reservations: DashboardReservation[];
    loading: boolean;
    page: number;
    totalPages: number;
    onPageChange: (p: number) => void;
    onOpen: (r: DashboardReservation) => void;
    userReviews: Map<string, Review>;
    onReview: (r: DashboardReservation) => void;
}) {
    if (!loading && reservations.length === 0) return null;

    return (
        <div className={styles.resSection}>
            <div className={styles.resSectionHeader}>
                <span className={styles.resSectionLabel}>{title}</span>
                {!loading && <span className={styles.resSectionCount}>{reservations.length}</span>}
            </div>
            <div className={styles.resSectionItems}>
                {loading
                    ? <CardSkeletons />
                    : reservations.map((r) => (
                        <ResCard key={r.reservationId} r={r} sectionType={sectionType}
                            onOpen={onOpen} userReviews={userReviews} onReview={onReview} />
                    ))
                }
            </div>
            {!loading && totalPages > 1 && (
                <div className={styles.resPagination}>
                    <button className={styles.resPageBtn} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
                        <BiChevronLeft />
                    </button>
                    <span className={styles.resPageText}>{page} / {totalPages}</span>
                    <button className={styles.resPageBtn} disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
                        <BiChevronRight />
                    </button>
                </div>
            )}
        </div>
    );
}

// ── All Reservations sub-view ──────────────────────────────────────────────────

function PastReservationsView({
    stripeUserId, nowIso, onBack, onOpen, userReviews, onReview,
}: {
    stripeUserId: number;
    nowIso: string;
    onBack: () => void;
    onOpen: (r: DashboardReservation) => void;
    userReviews: Map<string, Review>;
    onReview: (r: DashboardReservation) => void;
}) {
    const [items,      setItems]      = useState<DashboardReservation[]>([]);
    const [page,       setPage]       = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [loading,    setLoading]    = useState(true);

    const fetchPage = async (p: number) => {
        setLoading(true);
        const result = await getReservationPage({
            user: String(stripeUserId),
            maxDropOffTime: nowIso,
            sortBy: "dropOffTime", sortDir: "desc",
            pageSize: String(PAGE_SIZE), page: String(p),
        });
        setItems(result.items.map(parseReservation));
        setTotalPages(result.totalPages);
        setTotalItems(result.totalItems);
        setPage(p);
        setLoading(false);
    };

    useEffect(() => {
        let ignore = false;
        getReservationPage({
            user: String(stripeUserId),
            maxDropOffTime: nowIso,
            sortBy: "dropOffTime", sortDir: "desc",
            pageSize: String(PAGE_SIZE), page: "1",
        }).then((result) => {
            if (ignore) return;
            setItems(result.items.map(parseReservation));
            setTotalPages(result.totalPages);
            setTotalItems(result.totalItems);
            setLoading(false);
        });
        return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className={styles.container}>
            <div>
                <button className={styles.backBtn} onClick={onBack}>
                    <BiChevronLeft /> Back to Reservations
                </button>
                <h1 className="page-title">Past Reservations</h1>
                <p className="page-subtitle">{totalItems > 0 ? `${totalItems} reservations` : "Loading…"}</p>
            </div>

            <div className={styles.resSection}>
                <div className={styles.resSectionItems}>
                    {loading
                        ? <CardSkeletons />
                        : items.map((r) => (
                            <ResCard key={r.reservationId} r={r} sectionType={getSectionType(r)}
                                onOpen={onOpen} userReviews={userReviews} onReview={onReview} />
                        ))
                    }
                </div>
                {!loading && totalPages > 1 && (
                    <div className={styles.resPagination}>
                        <button className={styles.resPageBtn} disabled={page <= 1} onClick={() => fetchPage(page - 1)}>
                            <BiChevronLeft />
                        </button>
                        <span className={styles.resPageText}>{page} / {totalPages}</span>
                        <button className={styles.resPageBtn} disabled={page >= totalPages} onClick={() => fetchPage(page + 1)}>
                            <BiChevronRight />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Panel ──────────────────────────────────────────────────────────────────────

type CatKey = "active" | "future" | "recent" | "past";

interface CatState {
    items: DashboardReservation[];
    page: number;
    totalPages: number;
    totalItems: number;
    loading: boolean;
}

const INIT_CAT_LOADING: CatState = { items: [], page: 1, totalPages: 1, totalItems: 0, loading: true };
const INIT_CAT_IDLE:    CatState = { items: [], page: 1, totalPages: 1, totalItems: 0, loading: false };

export default function ReservationsPanel() {
    const { openReservation, accountId, stripeUserId } = useUserDashboardStore();

    const nowIso        = useRef(new Date().toISOString());
    const threeWeeksAgo = useRef(new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString());

    const [cats, setCats] = useState<Record<CatKey, CatState>>({
        active: INIT_CAT_LOADING,
        future: INIT_CAT_LOADING,
        recent: INIT_CAT_LOADING,
        past:   INIT_CAT_IDLE,   // idle until we know the global total
    });
    const [globalTotal,  setGlobalTotal]  = useState<number | null>(null);
    const [userReviews,  setUserReviews]  = useState<Map<string, Review>>(new Map());
    const [reviewTarget, setReviewTarget] = useState<DashboardReservation | null>(null);
    const [showAll,      setShowAll]      = useState(false);

    const catParams = (key: CatKey, page: number): Record<string, string> => {
        const now = nowIso.current;
        const ago = threeWeeksAgo.current;
        const map: Record<CatKey, Record<string, string>> = {
            future: { minPickUpTime: now,  sortBy: "pickUpTime",  sortDir: "asc",  pageSize: String(PAGE_SIZE), page: String(page) },
            active: { minDropOffTime: now, maxPickUpTime: now,    sortBy: "dropOffTime", sortDir: "asc",  pageSize: "100", page: "1" },
            recent: { minDropOffTime: ago, maxDropOffTime: now,   sortBy: "dropOffTime", sortDir: "desc", pageSize: String(PAGE_SIZE), page: String(page) },
            past:   { maxDropOffTime: ago,                        sortBy: "dropOffTime", sortDir: "desc", pageSize: String(PAGE_SIZE), page: String(page) },
        };
        return map[key];
    };

    useEffect(() => {
        if (!stripeUserId) return;
        let ignore = false;

        const fetchCat = async (key: CatKey) => {
            const result = await getReservationPage({ user: String(stripeUserId), ...catParams(key, 1) });
            if (ignore) return;
            const items = result.items.map(parseReservation);
            setCats(prev => ({ ...prev, [key]: { items, page: 1, totalPages: result.totalPages, totalItems: result.totalItems, loading: false } }));
        };

        // Fetch active, future, recent immediately
        fetchCat("active");
        fetchCat("future");
        fetchCat("recent");

        // Fetch global total with no time filters; if ≤ 30 also fetch past
        getReservationPage({ user: String(stripeUserId), pageSize: "1", page: "1" })
            .then(({ totalItems }) => {
                if (ignore) return;
                setGlobalTotal(totalItems);
                if (totalItems <= 30) {
                    setCats(prev => ({ ...prev, past: INIT_CAT_LOADING }));
                    fetchCat("past");
                }
            });

        return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stripeUserId]);

    const changePage = async (key: CatKey, newPage: number) => {
        if (!stripeUserId) return;
        setCats(prev => ({ ...prev, [key]: { ...prev[key], loading: true } }));
        const result = await getReservationPage({ user: String(stripeUserId), ...catParams(key, newPage) });
        const items = result.items.map(parseReservation);
        setCats(prev => ({ ...prev, [key]: { items, page: newPage, totalPages: result.totalPages, totalItems: result.totalItems, loading: false } }));
    };

    useEffect(() => {
        if (!accountId) return;
        let ignore = false;
        getReviewsForAccount(accountId)
            .then((data) => {
                if (ignore) return;
                const map = new Map<string, Review>();
                data.forEach((rv) => {
                    const vin = typeof rv.car === "string" ? rv.car : (rv.car as { vin: string }).vin;
                    map.set(vin, rv);
                });
                setUserReviews(map);
            })
            .catch(() => {});
        return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accountId]);

    if (!stripeUserId) return <FullSkeleton />;

    const anyLoading   = cats.active.loading || cats.future.loading || cats.recent.loading;
    const showPastBtn  = globalTotal !== null && globalTotal > 30;
    const showPastSect = globalTotal !== null && globalTotal <= 30;

    const sharedProps = { userReviews, onReview: setReviewTarget, onOpen: openReservation };

    // ── All Reservations sub-view ──────────────────────────────────────────────
    if (showAll) {
        return (
            <>
                {reviewTarget && accountId && stripeUserId && (
                    <ReviewModal
                        vin={reviewTarget.car?.vin ?? ""}
                        carName={reviewTarget.car ? `${reviewTarget.car.make} ${reviewTarget.car.model}` : "Unknown Vehicle"}
                        acctId={accountId} userId={stripeUserId}
                        durationDays={reviewTarget.durationDays}
                        existingReview={reviewTarget.car?.vin ? userReviews.get(reviewTarget.car.vin) : undefined}
                        onClose={() => setReviewTarget(null)}
                        onSaved={(saved) => {
                            const vin = typeof saved.car === "string" ? saved.car : (saved.car as { vin: string }).vin;
                            setUserReviews((prev) => new Map(prev).set(vin, saved));
                            setReviewTarget(null);
                        }}
                        onDeleted={() => {
                            const vin = reviewTarget.car?.vin;
                            if (vin) setUserReviews((prev) => { const m = new Map(prev); m.delete(vin); return m; });
                            setReviewTarget(null);
                        }}
                    />
                )}
                <PastReservationsView
                    stripeUserId={stripeUserId}
                    nowIso={nowIso.current}
                    onBack={() => setShowAll(false)}
                    {...sharedProps}
                />
            </>
        );
    }

    // ── Categorised view ───────────────────────────────────────────────────────
    return (
        <>
            {reviewTarget && accountId && stripeUserId && (
                <ReviewModal
                    vin={reviewTarget.car?.vin ?? ""}
                    carName={reviewTarget.car ? `${reviewTarget.car.make} ${reviewTarget.car.model}` : "Unknown Vehicle"}
                    acctId={accountId} userId={stripeUserId}
                    durationDays={reviewTarget.durationDays}
                    existingReview={reviewTarget.car?.vin ? userReviews.get(reviewTarget.car.vin) : undefined}
                    onClose={() => setReviewTarget(null)}
                    onSaved={(saved) => {
                        const vin = typeof saved.car === "string" ? saved.car : (saved.car as { vin: string }).vin;
                        setUserReviews((prev) => new Map(prev).set(vin, saved));
                        setReviewTarget(null);
                        if (accountId) {
                            getReviewsForAccount(accountId)
                                .then((data) => {
                                    const map = new Map<string, Review>();
                                    data.forEach((rv) => {
                                        const v = typeof rv.car === "string" ? rv.car : (rv.car as { vin: string }).vin;
                                        map.set(v, rv);
                                    });
                                    setUserReviews(map);
                                })
                                .catch(() => {});
                        }
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
                    <p className="page-subtitle">
                        {globalTotal === null ? "Loading…" : `Total ${globalTotal}`}
                    </p>
                </div>

                <Section title="Active"   sectionType="active"
                    reservations={cats.active.items} loading={cats.active.loading}
                    page={cats.active.page} totalPages={cats.active.totalPages}
                    onPageChange={(p) => changePage("active", p)} {...sharedProps} />
                <Section title="Upcoming" sectionType="future"
                    reservations={cats.future.items} loading={cats.future.loading}
                    page={cats.future.page} totalPages={cats.future.totalPages}
                    onPageChange={(p) => changePage("future", p)} {...sharedProps} />
                <Section title="Recent"   sectionType="recent"
                    reservations={cats.recent.items} loading={cats.recent.loading}
                    page={cats.recent.page} totalPages={cats.recent.totalPages}
                    onPageChange={(p) => changePage("recent", p)} {...sharedProps} />

                {showPastSect && (
                    <Section title="Past" sectionType="past"
                        reservations={cats.past.items} loading={cats.past.loading}
                        page={cats.past.page} totalPages={cats.past.totalPages}
                        onPageChange={(p) => changePage("past", p)} {...sharedProps} />
                )}

                {showPastBtn && !anyLoading && (
                    <button className={styles.showAllBtn} onClick={() => setShowAll(true)}>
                        Show Past Reservations
                    </button>
                )}
            </div>
        </>
    );
}
