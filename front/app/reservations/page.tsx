"use client";

import { useState } from "react";
import Image from "next/image";
import NavHeader from "../components/headers/navHeader";
import MainBodyContainer from "../components/containers/mainBodyContainer";
import { BiCalendar, BiCar, BiReceipt, BiTime } from "react-icons/bi";
import styles from "./reservations.module.css";

interface Car {
    vin: string;
    make: string;
    model: string;
    images: string[];
}

interface Reservation {
    reservationId: number;
    carVin: string;
    userId: number;
    paymentIds: string[];
    pickUpTime: string;
    dropOffTime: string;
    dateBooked: string;
    duration: number;
    durationHours: number;
    durationDays: number;
    car: Car | null;
}

const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const fmtDateTime = (d: string) =>
    new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

export default function ReservationsPage() {
    const [userId, setUserId] = useState("");
    const [reservations, setReservations] = useState<Reservation[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const hasResults = reservations !== null;

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setReservations(null);

        try {
            const res = await fetch(`/api/reservations?userId=${encodeURIComponent(userId)}`);
            if (!res.ok) throw new Error((await res.json()).error ?? "Failed to load reservations.");
            setReservations(await res.json());
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <NavHeader white={false} />

            {!hasResults ? (
                <div className={styles.centeredWrapper}>
                    <div className={styles.centeredCard}>
                        <div>
                            <p className={styles.centeredLabel}>Reservations</p>
                            <p className={styles.centeredSubtitle}>Enter a user ID to view their reservations</p>
                        </div>
                        <form onSubmit={handleSearch} className={styles.centeredForm}>
                            <div className={styles.centeredFieldGroup}>
                                <label className={styles.centeredFieldLabel}>User ID</label>
                                <input
                                    className={styles.userIdInput}
                                    type="number"
                                    placeholder="e.g. 1"
                                    value={userId}
                                    onChange={(e) => setUserId(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            <button type="submit" className={styles.searchBtn} disabled={loading}>
                                {loading ? "Loading..." : "See Reservations"}
                            </button>
                        </form>
                        {error && <p className={styles.centeredError}>{error}</p>}
                    </div>
                </div>
            ) : (
                <div className={styles.pageWrapper}>
                    <MainBodyContainer>
                        <div className={styles.resultsHeader}>
                            <div>
                                <h1 className={styles.heading}>Reservations</h1>
                                <p className={styles.resultCount}>
                                    User {userId} · {reservations.length} reservation{reservations.length !== 1 ? "s" : ""}
                                </p>
                            </div>
                            <form onSubmit={handleSearch} className={styles.inlineForm}>
                                <input
                                    className={styles.userIdInputSm}
                                    type="number"
                                    placeholder="User ID"
                                    value={userId}
                                    onChange={(e) => setUserId(e.target.value)}
                                    required
                                />
                                <button type="submit" className={styles.searchBtnSm} disabled={loading}>
                                    {loading ? "..." : "Search"}
                                </button>
                            </form>
                        </div>

                        {error && <p className={styles.errorText}>{error}</p>}

                        {reservations.length === 0 ? (
                            <div className={styles.stateBox}>
                                <BiReceipt className={styles.emptyIcon} />
                                <p className={styles.stateText}>No reservations found for this user.</p>
                            </div>
                        ) : (
                            <div className={styles.list}>
                                {reservations.map((r) => (
                                    <div key={r.reservationId} className={styles.card}>
                                        <div className={styles.cardHeader}>
                                            <div className={styles.cardId}>
                                                <BiReceipt className={styles.cardIdIcon} />
                                                <span>Reservation #{r.reservationId}</span>
                                            </div>
                                            <span className={styles.bookedOn}>Booked {fmtDate(r.dateBooked)}</span>
                                        </div>

                                        <div className={styles.cardBody}>
                                            <div className={styles.carRow}>
                                                <div className={styles.carThumb}>
                                                    {r.car?.images?.[0] ? (
                                                        <Image
                                                            src={r.car.images[0]}
                                                            alt={`${r.car.make} ${r.car.model}`}
                                                            fill
                                                            className={styles.carThumbImg}
                                                            sizes="80px"
                                                        />
                                                    ) : (
                                                        <BiCar className={styles.carThumbFallback} />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className={styles.carName}>
                                                        {r.car ? `${r.car.make} ${r.car.model}` : "Unknown Vehicle"}
                                                    </p>
                                                    <p className={styles.carVin}>{r.carVin}</p>
                                                </div>
                                            </div>

                                            <div className={styles.datesRow}>
                                                <div className={styles.infoRow}>
                                                    <BiCalendar className={styles.infoIcon} />
                                                    <div>
                                                        <p className={styles.infoLabel}>Pick Up</p>
                                                        <p className={styles.infoValue}>{fmtDateTime(r.pickUpTime)}</p>
                                                    </div>
                                                </div>
                                                <div className={styles.infoRow}>
                                                    <BiCalendar className={styles.infoIcon} />
                                                    <div>
                                                        <p className={styles.infoLabel}>Drop Off</p>
                                                        <p className={styles.infoValue}>{fmtDateTime(r.dropOffTime)}</p>
                                                    </div>
                                                </div>
                                                <div className={styles.infoRow}>
                                                    <BiTime className={styles.infoIcon} />
                                                    <div>
                                                        <p className={styles.infoLabel}>Duration</p>
                                                        <p className={styles.infoValue}>
                                                            {r.durationDays} day{r.durationDays !== 1 ? "s" : ""}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </MainBodyContainer>
                </div>
            )}
        </>
    );
}
