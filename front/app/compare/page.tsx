"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import NavHeader from "@/app/components/headers/navHeader";
import { useBookmarkStore } from "@/stores/bookmarkStore";
import { useUserDashboardStore } from "@/stores/userDashboardStore";
import { browserApi } from "@/app/lib/fcr-client";
import type { Car } from "@/app/lib/fcr-client";
import { BiArrowBack } from "react-icons/bi";
import styles from "./compare.module.css";

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (s: string) =>
    s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const SPECS: { label: string; key: keyof Car; render?: (v: unknown) => string }[] = [
    { label: "Price / Day",    key: "pricePerDay",  render: (v) => `$${v}` },
    { label: "Year",           key: "modelYear" },
    { label: "Body Type",      key: "bodyType",     render: (v) => fmt(String(v)) },
    { label: "Vehicle Class",  key: "vehicleClass", render: (v) => fmt(String(v)) },
    { label: "Engine",         key: "engineLayout", render: (v) => fmt(String(v)) },
    { label: "Cylinders",      key: "cylinders" },
    { label: "Horsepower",     key: "horsepower",   render: (v) => `${v} hp` },
    { label: "Torque",         key: "torque",       render: (v) => `${v} lb-ft` },
    { label: "Transmission",   key: "transmission", render: (v) => fmt(String(v)) },
    { label: "Drivetrain",     key: "drivetrain" },
    { label: "Fuel",           key: "fuel",         render: (v) => fmt(String(v)) },
    { label: "MPG",            key: "mpg",          render: (v) => `${v} mpg` },
    { label: "Seats",          key: "seats" },
    { label: "Gears",          key: "gears" },
    { label: "Roof",           key: "roofType",     render: (v) => fmt(String(v)) },
];

function getVal(car: Car | null, key: keyof Car, renderFn?: (v: unknown) => string): string {
    if (!car) return "—";
    const raw = car[key];
    if (raw === undefined || raw === null || raw === "") return "—";
    if (Array.isArray(raw)) return raw.length > 0 ? raw.join(", ") : "—";
    return renderFn ? renderFn(raw) : String(raw);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ComparePage() {
    const router = useRouter();
    const bookmarks = useBookmarkStore((s) => s.bookmarks);
    const { isAuthenticated } = useUserDashboardStore();
    const [cars, setCars] = useState<(Car | null)[]>([]);
    const [loaded, setLoaded] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) { router.replace("/login"); return; }
        if (bookmarks.length === 0) { router.replace("/browse"); return; }
    }, [isAuthenticated, bookmarks.length, router]);

    useEffect(() => {
        if (bookmarks.length === 0) return;
        setLoading(true);
        setLoaded(0);
        setCars([]);
        let done = 0;
        Promise.all(
            bookmarks.map((b) =>
                browserApi.cars.getById(b.vin)
                    .catch(() => null)
                    .then((c) => { done++; setLoaded(done); return c; })
            )
        ).then((results) => { setCars(results); setLoading(false); });
    }, [bookmarks]);

    if (!isAuthenticated || bookmarks.length === 0) return null;

    return (
        <div className={styles.page}>
            <NavHeader white={false} />

            <div className={styles.content}>
                {/* Back */}
                <Link href="/browse" className={styles.backBtn}>
                    <BiArrowBack /> Browse
                </Link>

                <h1 className={styles.title}>Compare Cars</h1>
                <p className={styles.subtitle}>
                    {bookmarks.length} bookmarked {bookmarks.length === 1 ? "car" : "cars"} · highlighted rows differ
                </p>

                {loading ? (
                    <div className={styles.loadingWrap}>
                        <div className={styles.spinner} />
                        <p className={styles.loadingCount}>
                            {loaded} / {bookmarks.length} cars loaded
                        </p>
                        <p className={styles.funFact}>
                            <span className={styles.funFactLabel}>Fun fact</span>
                            The Nürburgring Nordschleife, used as a benchmark by nearly every German automaker, is 20.8 km long with over 300 corners — engineers call it "the Green Hell."
                        </p>
                    </div>
                ) : (
                    <div className={styles.tableOuter}>
                        <table className={styles.table}>
                            {/* ── Car header row ── */}
                            <thead>
                                <tr>
                                    <th className={styles.labelCol} />
                                    {cars.map((car, i) => (
                                        <th key={i} className={styles.carCol}>
                                            <Link
                                                href={`/car/${bookmarks[i].vin}`}
                                                className={styles.carCard}
                                            >
                                                <div className={styles.carImgWrap}>
                                                    {(car?.images?.[0] ?? bookmarks[i].image) ? (
                                                        <Image
                                                            src={(car?.images?.[0] ?? bookmarks[i].image)!}
                                                            alt={`${car?.make ?? bookmarks[i].make} ${car?.model ?? bookmarks[i].model}`}
                                                            fill
                                                            className={styles.carImg}
                                                        />
                                                    ) : (
                                                        <div className={styles.carImgPlaceholder} />
                                                    )}
                                                    <div className={styles.carOverlay}>
                                                        <span className={styles.carName}>
                                                            {car?.make ?? bookmarks[i].make} {car?.model ?? bookmarks[i].model}
                                                        </span>
                                                        {car?.modelYear && (
                                                            <span className={styles.carYear}>{car.modelYear}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </Link>
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            {/* ── Spec rows ── */}
                            <tbody>
                                {SPECS.map(({ label, key, render: renderFn }) => {
                                    const vals = cars.map((c) => getVal(c, key, renderFn));
                                    const allSame = vals.every((v) => v === vals[0]);
                                    return (
                                        <tr key={key} className={allSame ? styles.row : styles.rowDiff}>
                                            <td className={styles.labelCell}>{label}</td>
                                            {vals.map((v, i) => (
                                                <td key={i} className={allSame ? styles.valCell : styles.valCellDiff}>
                                                    {v}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}

                                {/* Features row */}
                                <tr className={styles.featuresRow}>
                                    <td className={styles.labelCell}>Features</td>
                                    {cars.map((car, i) => (
                                        <td key={i} className={styles.featuresCell}>
                                            {car?.features?.length ? (
                                                <ul className={styles.featureList}>
                                                    {car.features.map((f, fi) => (
                                                        <li key={fi} className={styles.featureItem}>{f}</li>
                                                    ))}
                                                </ul>
                                            ) : "—"}
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
