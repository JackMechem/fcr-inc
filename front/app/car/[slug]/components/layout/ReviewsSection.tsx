"use client";

import { useState } from "react";
import { Review } from "@/app/types/ReviewTypes";
import { useUserDashboardStore } from "@/stores/userDashboardStore";
import StarRating from "@/app/components/reviews/StarRating";
import ReviewModal from "@/app/components/reviews/ReviewModal";
import { BiPencil } from "react-icons/bi";
import reviewStyles from "@/app/components/reviews/reviews.module.css";

const fmtDate = (raw: string | number) => {
    const ms = typeof raw === "number" ? raw * 1000 : isNaN(Number(raw)) ? new Date(raw).getTime() : Number(raw) * 1000;
    return new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const getAcctId = (account: Review["account"]): number | null => {
    if (typeof account === "number") return account;
    if (typeof account === "object" && account !== null) return account.acctId;
    return null;
};

const getAuthorName = (account: Review["account"]): string => {
    if (typeof account === "object" && account !== null) return account.name ?? "Anonymous";
    return "Anonymous";
};

interface ReviewsSectionProps {
    initialReviews: Review[];
    vin: string;
    carName: string;
}

const ReviewsSection = ({ initialReviews, vin, carName }: ReviewsSectionProps) => {
    const [reviews, setReviews] = useState<Review[]>(initialReviews);
    const [editingReview, setEditingReview] = useState<Review | null>(null);
    const { accountId, stripeUserId } = useUserDashboardStore();

    const handleSaved = (updated: Review) => {
        setReviews((prev) => prev.map((r) => r.reviewId === updated.reviewId ? updated : r));
        setEditingReview(null);
    };

    const handleDeleted = (reviewId: number) => {
        setReviews((prev) => prev.filter((r) => r.reviewId !== reviewId));
        setEditingReview(null);
    };

    return (
        <div className={reviewStyles.reviewsSection}>
            <div className={reviewStyles.reviewsSectionTitle}>
                Reviews
                {reviews.length > 0 && (
                    <StarRating
                        average={reviews.reduce((s, r) => s + r.stars, 0) / reviews.length}
                        count={reviews.length}
                        size="sm"
                    />
                )}
            </div>

            {reviews.length === 0 ? (
                <p className={reviewStyles.reviewsEmpty}>No reviews yet for this vehicle.</p>
            ) : (
                <div className={reviewStyles.reviewsList}>
                    {reviews.map((r) => {
                        const isOwn = accountId !== null && getAcctId(r.account) === accountId;
                        return (
                            <div key={r.reviewId} className={reviewStyles.reviewCard}>
                                <div className={reviewStyles.reviewHeader}>
                                    <div className={reviewStyles.reviewTitleStars}>
                                        <StarRating average={r.stars} size="sm" />
                                        <p className={reviewStyles.reviewTitle}>{r.title}</p>
                                    </div>
                                    <div className={reviewStyles.reviewMetaRow}>
                                        <span className={reviewStyles.reviewMeta}>{fmtDate(r.publishedDate)}</span>
                                        {isOwn && (
                                            <button
                                                className={reviewStyles.reviewEditBtn}
                                                onClick={() => setEditingReview(r)}
                                                aria-label="Edit review"
                                            >
                                                <BiPencil />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {r.bodyOfText && (
                                    <p className={reviewStyles.reviewBody}>{r.bodyOfText}</p>
                                )}
                                <p className={reviewStyles.reviewDuration}>
                                    {getAuthorName(r.account)} · {r.rentalDuration} day rental
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}

            {editingReview && (
                <ReviewModal
                    vin={vin}
                    carName={carName}
                    acctId={accountId!}
                    userId={stripeUserId ?? 0}
                    durationDays={editingReview.rentalDuration}
                    existingReview={editingReview}
                    onClose={() => setEditingReview(null)}
                    onSaved={handleSaved}
                    onDeleted={() => handleDeleted(editingReview.reviewId)}
                />
            )}
        </div>
    );
};

export default ReviewsSection;
