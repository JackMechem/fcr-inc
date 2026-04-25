"use client";

import { Car } from "@/app/types/CarTypes";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { BiImages, BiX, BiChevronLeft, BiChevronRight } from "react-icons/bi";
import styles from "../carDetail.module.css";

interface ShowAllImagesButtonProps {
    images: Car["images"];
}

// Map each image index to its flat position in the images array
function buildRows(images: string[]) {
    const rows: Array<{ type: "hero"; idx: number } | { type: "pair"; idxs: [number, number] }> = [];
    rows.push({ type: "hero", idx: 0 });
    const rest = images.slice(1);
    for (let i = 0; i < rest.length; i += 2) {
        if (rest[i + 1] !== undefined) {
            rows.push({ type: "pair", idxs: [i + 1, i + 2] });
        } else {
            rows.push({ type: "hero", idx: i + 1 });
        }
    }
    return rows;
}

const ShowAllImagesButton = ({ images }: ShowAllImagesButtonProps) => {
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    const lightboxOpen = lightboxIndex !== null;

    useEffect(() => {
        const lock = galleryOpen || lightboxOpen;
        document.body.style.overflow = lock ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [galleryOpen, lightboxOpen]);

    const openLightbox = (idx: number) => setLightboxIndex(idx);
    const closeLightbox = () => setLightboxIndex(null);

    const prev = useCallback(() => {
        setLightboxIndex((i) => (i === null ? 0 : (i - 1 + images.length) % images.length));
    }, [images.length]);

    const next = useCallback(() => {
        setLightboxIndex((i) => (i === null ? 0 : (i + 1) % images.length));
    }, [images.length]);

    useEffect(() => {
        if (!lightboxOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") prev();
            else if (e.key === "ArrowRight") next();
            else if (e.key === "Escape") closeLightbox();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [lightboxOpen, prev, next]);

    const rows = buildRows(images);

    return (
        <>
            <button onClick={() => setGalleryOpen(true)} className={styles.viewAllBtn}>
                <BiImages />
                <span>View all {images.length} photos</span>
            </button>

            {/* ── Gallery overlay ── */}
            {galleryOpen && (
                <div className={styles.galleryOverlay}>
                    <div className={styles.galleryHeader}>
                        <span className={styles.galleryCount}>{images.length} photos</span>
                        <button className={styles.galleryCloseBtn} onClick={() => setGalleryOpen(false)} aria-label="Close gallery">
                            <BiX />
                        </button>
                    </div>

                    <div className={styles.galleryContent}>
                        {rows.map((row, ri) =>
                            row.type === "hero" ? (
                                <div
                                    key={ri}
                                    className={styles.galleryHeroSlot}
                                    onClick={() => openLightbox(row.idx)}
                                >
                                    <Image
                                        src={images[row.idx]}
                                        alt={`Photo ${row.idx + 1}`}
                                        fill
                                        sizes="(min-width: 1280px) 1200px, 100vw"
                                        className={styles.galleryImg}
                                        quality={90}
                                        priority={ri === 0}
                                        loading={ri === 0 ? "eager" : "lazy"}
                                    />
                                </div>
                            ) : (
                                <div key={ri} className={styles.galleryPairRow}>
                                    {row.idxs.map((imgIdx, pi) => (
                                        <div
                                            key={pi}
                                            className={styles.galleryPairSlot}
                                            onClick={() => openLightbox(imgIdx)}
                                        >
                                            <Image
                                                src={images[imgIdx]}
                                                alt={`Photo ${imgIdx + 1}`}
                                                fill
                                                sizes="(min-width: 1280px) 600px, 50vw"
                                                className={styles.galleryImg}
                                                quality={90}
                                                loading="lazy"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )
                        )}
                    </div>
                </div>
            )}

            {/* ── Lightbox ── */}
            {lightboxOpen && lightboxIndex !== null && (
                <div className={styles.lightbox} onClick={closeLightbox}>
                    {/* Backdrop click closes; stop propagation on inner elements */}
                    <div className={styles.lightboxInner} onClick={(e) => e.stopPropagation()}>
                        <Image
                            src={images[lightboxIndex]}
                            alt={`Photo ${lightboxIndex + 1}`}
                            fill
                            sizes="100vw"
                            className={styles.lightboxImg}
                            unoptimized
                            priority
                        />
                    </div>

                    {/* Counter */}
                    <div className={styles.lightboxCounter}>
                        {lightboxIndex + 1} / {images.length}
                    </div>

                    {/* Close */}
                    <button className={styles.lightboxClose} onClick={closeLightbox} aria-label="Close">
                        <BiX />
                    </button>

                    {/* Chevrons */}
                    <button className={`${styles.lightboxChevron} ${styles.lightboxChevronLeft}`} onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Previous">
                        <BiChevronLeft />
                    </button>
                    <button className={`${styles.lightboxChevron} ${styles.lightboxChevronRight}`} onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Next">
                        <BiChevronRight />
                    </button>
                </div>
            )}
        </>
    );
};

export default ShowAllImagesButton;
