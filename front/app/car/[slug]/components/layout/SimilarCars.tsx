import Link from "next/link";
import { BiChevronRight } from "react-icons/bi";
import { getSimilarCars } from "../../actions";
import CarGridCard from "@/app/components/cars/carGridCard";
import CarGridCardSkeleton from "@/app/components/skeletons/CarGridCardSkeleton";
import styles from "../carDetail.module.css";

const browseHref = (make: string) => `/browse?make=${encodeURIComponent(make)}`;

export const SimilarCarsSkeleton = () => (
    <div className={styles.similarSection}>
        <div className={styles.similarTitleRow}>
            <p className={styles.similarTitle}>Similar Cars</p>
        </div>
        <div className={styles.similarGrid}>
            {Array.from({ length: 6 }).map((_, i) => (
                <CarGridCardSkeleton key={i} />
            ))}
        </div>
    </div>
);

const SimilarCars = async ({ make, excludeVin }: { make: string; excludeVin: string }) => {
    const cars = await getSimilarCars(make, excludeVin);
    if (cars.length === 0) return null;

    const href = browseHref(make);

    return (
        <div className={styles.similarSection}>
            <div className={styles.similarTitleRow}>
                <p className={styles.similarTitle}>More {make}</p>
                <Link href={href} className={styles.similarSeeAll}>
                    See all <BiChevronRight />
                </Link>
            </div>
            <div className={styles.similarGrid}>
                {cars.map((car) => (
                    <CarGridCard key={car.vin} car={car} />
                ))}
            </div>
            <div className={styles.similarCtaRow}>
                <Link href={href} className={styles.similarCtaBtn}>
                    Browse all {make} cars
                </Link>
            </div>
        </div>
    );
};

export default SimilarCars;
