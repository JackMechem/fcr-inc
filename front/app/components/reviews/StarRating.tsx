import styles from "./reviews.module.css";

interface StarRatingProps {
    /** Average stars (0–5, can be fractional) */
    average: number;
    /** Total number of reviews */
    count?: number;
    size?: "sm" | "md";
}

const StarRating = ({ average, count, size = "sm" }: StarRatingProps) => {
    const clamped = Math.max(0, Math.min(5, average));

    return (
        <div className={`${styles.starRow} ${size === "md" ? styles.starRowMd : ""}`}>
            {Array.from({ length: 5 }, (_, i) => {
                const filled = clamped >= i + 1;
                const half = !filled && clamped >= i + 0.5;
                return (
                    <span
                        key={i}
                        className={`${styles.star} ${filled ? styles.starFull : half ? styles.starHalf : styles.starEmpty}`}
                    >★</span>
                );
            })}
            {count !== undefined && (
                <span className={styles.starCount}>
                    {clamped.toFixed(1)} ({count})
                </span>
            )}
        </div>
    );
};

export default StarRating;
