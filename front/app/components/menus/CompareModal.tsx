"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { IoClose } from "react-icons/io5";
import { Car } from "@/app/lib/fcr-client";
import { BookmarkCar } from "@/stores/bookmarkStore";
import { browserApi } from "@/app/lib/fcr-client";
import styles from "./compareModal.module.css";

// ── Spec rows ─────────────────────────────────────────────────────────────────

const SPECS: { label: string; key: keyof Car; fmt?: (v: unknown) => string }[] = [
    { label: "Price / day",    key: "pricePerDay",   fmt: (v) => `$${v}` },
    { label: "Year",           key: "modelYear" },
    { label: "Body type",      key: "bodyType" },
    { label: "Vehicle class",  key: "vehicleClass" },
    { label: "Engine",         key: "engineLayout" },
    { label: "Cylinders",      key: "cylinders" },
    { label: "Horsepower",     key: "horsepower",    fmt: (v) => `${v} hp` },
    { label: "Torque",         key: "torque",        fmt: (v) => `${v} lb-ft` },
    { label: "Transmission",   key: "transmission" },
    { label: "Drivetrain",     key: "drivetrain" },
    { label: "Fuel",           key: "fuel" },
    { label: "MPG",            key: "mpg",           fmt: (v) => `${v} mpg` },
    { label: "Seats",          key: "seats" },
    { label: "Gears",          key: "gears" },
    { label: "Roof",           key: "roofType" },
    { label: "Features",       key: "features",      fmt: (v) => Array.isArray(v) ? (v as string[]).join(", ") || "—" : String(v ?? "—") },
];

// ── Component ─────────────────────────────────────────────────────────────────

interface CompareModalProps {
    bookmarks: BookmarkCar[];
    onClose: () => void;
}

const CompareModal = ({ bookmarks, onClose }: CompareModalProps) => {
    const [cars, setCars] = useState<(Car | null)[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        Promise.all(bookmarks.map((b) => browserApi.cars.getById(b.vin).catch(() => null)))
            .then((results) => { if (!cancelled) { setCars(results); setLoading(false); } });
        return () => { cancelled = true; };
    }, [bookmarks]);

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [onClose]);

    const getVal = (car: Car | null, key: keyof Car, fmt?: (v: unknown) => string): string => {
        if (!car) return "—";
        const raw = car[key];
        if (raw === undefined || raw === null || raw === "") return "—";
        return fmt ? fmt(raw) : String(raw);
    };

    const modal = (
        <div className={styles.backdrop} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <span className={styles.modalTitle}>Compare Bookmarks</span>
                    <button className={styles.closeBtn} onClick={onClose}><IoClose /></button>
                </div>

                {loading ? (
                    <div className={styles.loading}>Loading specs…</div>
                ) : (
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th className={styles.specLabel} />
                                    {cars.map((car, i) => (
                                        <th key={i} className={styles.carHeader}>
                                            {car ? (
                                                <Link href={`/car/${car.vin}`} onClick={onClose} className={styles.carLink}>
                                                    {car.images?.[0] && (
                                                        <Image
                                                            src={car.images[0]}
                                                            alt={`${car.make} ${car.model}`}
                                                            width={120}
                                                            height={75}
                                                            className={styles.carImg}
                                                        />
                                                    )}
                                                    <span className={styles.carName}>{car.make} {car.model}</span>
                                                    <span className={styles.carYear}>{car.modelYear}</span>
                                                </Link>
                                            ) : (
                                                <span className={styles.carName}>{bookmarks[i]?.make} {bookmarks[i]?.model}</span>
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {SPECS.map(({ label, key, fmt }) => {
                                    const vals = cars.map((c) => getVal(c, key, fmt));
                                    const allSame = vals.every((v) => v === vals[0]);
                                    return (
                                        <tr key={key} className={styles.row}>
                                            <td className={styles.specLabel}>{label}</td>
                                            {vals.map((v, i) => (
                                                <td
                                                    key={i}
                                                    className={`${styles.specVal} ${!allSame ? styles.specDiff : ""}`}
                                                >
                                                    {v}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );

    return typeof document !== "undefined" ? createPortal(modal, document.body) : null;
};

export default CompareModal;
