"use client";

import { useEffect, useState } from "react";
import { getAllReservations } from "@/app/lib/ReservationApi";
import { Reservation } from "@/app/types/ReservationTypes";
import Image from "next/image";
import {
    BiSearch,
    BiCar,
    BiRefresh,
    BiChevronDown,
    BiChevronUp,
} from "react-icons/bi";
import styles from "./inventoryPanel.module.css";

const fmt = (key: string) =>
    key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

const fmtTimestamp = (ts: number) =>
    new Date(ts * 1000).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });

const Badge = ({ children }: { children: React.ReactNode }) => (
    <span className={styles.badge}>{children}</span>
);

const SKIP_CAR = new Set(["vin", "make", "model", "modelYear", "images", "description"]);

const ExpandedRow = ({ res }: { res: Reservation }) => {
    const user = typeof res.user === "object" && res.user !== null ? res.user as Record<string, unknown> : null;
    const carDetails = Object.entries(res.car).filter(([k]) => !SKIP_CAR.has(k));

    return (
        <div className={styles.expandedSection}>
            {/* Reservation details */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                    <p className={styles.columnLabel}>Reservation</p>
                    <div className={styles.detailsGrid}>
                        {[
                            ["ID", String(res.reservationId)],
                            ["Booked", fmtTimestamp(res.dateBooked)],
                            ["Pick-up", fmtTimestamp(res.pickUpTime)],
                            ["Drop-off", fmtTimestamp(res.dropOffTime)],
                            ["Duration", `${res.durationDays}d ${res.durationHours % 24}h`],
                            ["Payments", String(Array.isArray(res.payments) ? res.payments.length : 0)],
                        ].map(([label, value]) => (
                            <div key={label}>
                                <p className={styles.columnLabel}>{label}</p>
                                <p className={styles.detailValue}>{value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {user && (
                    <div>
                        <p className={styles.columnLabel}>Customer</p>
                        <div className={styles.detailsGrid}>
                            {[
                                ["Name", `${user.firstName} ${user.lastName}`],
                                ["Email", String(user.email ?? "—")],
                                ["Phone", String(user.phoneNumber ?? "—")],
                            ].map(([label, value]) => (
                                <div key={label}>
                                    <p className={styles.columnLabel}>{label}</p>
                                    <p className={styles.detailValue}>{String(value)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div>
                    <p className={styles.columnLabel}>Vehicle Specs</p>
                    <div className={styles.detailsGrid}>
                        {carDetails.map(([key, val]) => (
                            <div key={key}>
                                <p className={styles.columnLabel}>{fmt(key)}</p>
                                <p className={styles.detailValue}>
                                    {Array.isArray(val) ? (val.length ? val.join(", ") : "—") : String(val ?? "—")}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Gallery */}
            <div>
                <p className={styles.columnLabel}>Gallery</p>
                {res.car.images?.length ? (
                    <div className={styles.galleryScroll}>
                        {res.car.images.map((url, i) => (
                            <div key={i} className={styles.thumbnail} style={{ width: "110px", height: "74px", flexShrink: 0 }}>
                                <Image src={url} alt="" fill className={styles.objectCover} sizes="110px"
                                    onError={(e) => (e.currentTarget.style.display = "none")} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className={styles.carYear}>No images.</p>
                )}
            </div>
        </div>
    );
};

const ReservationsPanel = () => {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);
    const [query, setQuery] = useState("");
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const fetchReservations = async () => {
        setLoading(true);
        try {
            const res = await getAllReservations({ pageSize: 100 });
            setReservations(res.data);
            setHasFetched(true);
        } catch (e) {
            alert("Fetch failed: " + e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReservations(); }, []);

    const filtered = reservations.filter((r) =>
        `${r.car.make} ${r.car.model} ${r.car.vin} ${r.reservationId}`
            .toLowerCase()
            .includes(query.toLowerCase())
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h2 className="page-title">Reservations</h2>
                    {hasFetched && (
                        <p className="page-subtitle">
                            {filtered.length} of {reservations.length} reservations
                        </p>
                    )}
                </div>
                <button
                    onClick={fetchReservations}
                    disabled={loading}
                    className={`${styles.btn} ${styles.btnRefresh}`}
                >
                    <BiRefresh className={loading ? styles.spinning : ""} />
                    Refresh
                </button>
            </div>

            <div className={styles.searchWrapper}>
                <BiSearch className={styles.searchIcon} />
                <input
                    className={styles.searchInput}
                    placeholder="Search by make, model, VIN or reservation ID…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

            <div className={styles.tableContainer}>
                <div className={styles.tableHeader}>
                    {["Vehicle", "Reservation ID", "Pick-up", "Drop-off", ""].map((h) => (
                        <p key={h} className={styles.columnLabel}>{h}</p>
                    ))}
                </div>

                <div className={styles.rowList}>
                    {!hasFetched && loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} style={{ height: 64, margin: "8px 20px", borderRadius: 12, background: "var(--color-third)", opacity: 0.3 }} />
                        ))
                    ) : filtered.length === 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", gap: 8, color: "var(--color-foreground-light)" }}>
                            <BiCar style={{ fontSize: "36pt", opacity: 0.3 }} />
                            <p style={{ fontSize: "11pt" }}>{hasFetched ? "No reservations match your search." : "No data loaded."}</p>
                        </div>
                    ) : (
                        filtered.map((res) => {
                            const isExpanded = expandedId === res.reservationId;
                            const user = typeof res.user === "object" && res.user !== null ? res.user as Record<string, unknown> : null;
                            return (
                                <div key={res.reservationId}>
                                    <div
                                        className={styles.summaryRow}
                                        onClick={() => setExpandedId(isExpanded ? null : res.reservationId)}
                                    >
                                        {/* Vehicle */}
                                        <div className={styles.vehicleCell}>
                                            <div className={styles.thumbnail} style={{ width: 52, height: 36 }}>
                                                {res.car.images?.[0] ? (
                                                    <Image src={res.car.images[0]} alt="" fill className={styles.objectCover} sizes="52px"
                                                        onError={(e) => (e.currentTarget.style.display = "none")} />
                                                ) : (
                                                    <div className={styles.placeholderIconWrapper}><BiCar /></div>
                                                )}
                                            </div>
                                            <div className={styles.minWidthZero}>
                                                <p className={styles.carTitle}>{res.car.make} {res.car.model}</p>
                                                <p className={styles.carYear}>{res.car.modelYear}</p>
                                            </div>
                                        </div>

                                        {/* Reservation ID */}
                                        <div className={styles.hideMobile}>
                                            <Badge>#{res.reservationId}</Badge>
                                        </div>

                                        {/* Pick-up */}
                                        <p className={`${styles.carYear} ${styles.hideMobile}`} style={{ fontSize: "10pt", color: "var(--color-foreground)" }}>
                                            {fmtTimestamp(res.pickUpTime)}
                                        </p>

                                        {/* Drop-off */}
                                        <p className={`${styles.carYear} ${styles.hideMobile}`} style={{ fontSize: "10pt", color: "var(--color-foreground)" }}>
                                            {fmtTimestamp(res.dropOffTime)}
                                            {user && <span style={{ display: "block", fontSize: "9pt", color: "var(--color-foreground-light)" }}>{String(user.firstName)} {String(user.lastName)}</span>}
                                        </p>

                                        {/* Chevron */}
                                        <div className={styles.actionGroup}>
                                            <span className={styles.chevronIcon}>
                                                {isExpanded ? <BiChevronUp /> : <BiChevronDown />}
                                            </span>
                                        </div>
                                    </div>

                                    {isExpanded && <ExpandedRow res={res} />}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReservationsPanel;
