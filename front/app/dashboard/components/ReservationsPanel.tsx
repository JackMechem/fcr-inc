"use client";

import { useState } from "react";
import Image from "next/image";
import { useUserDashboardStore, DashboardReservation } from "@/stores/userDashboardStore";
import { BiCalendar, BiCar, BiReceipt, BiTime, BiEdit, BiX } from "react-icons/bi";
import styles from "./panels.module.css";

// Backend returns Unix timestamps in seconds; multiply by 1000 for JS Date
const toMs = (d: string | number) => typeof d === "number" ? d * 1000 : d;

const fmtDate = (d: string | number) =>
    new Date(toMs(d)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const fmtDateTime = (d: string | number) =>
    new Date(toMs(d)).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

// ── Confirm Cancel Modal ───────────────────────────────────────────────────────

interface ConfirmModalProps {
    reservation: DashboardReservation;
    deleting: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

function ConfirmCancelModal({ reservation, deleting, onConfirm, onCancel }: ConfirmModalProps) {
    return (
        <div className={styles.modalOverlay} onClick={onCancel}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <p className={styles.modalTitle}>Cancel Reservation?</p>
                <p className={styles.modalBody}>
                    You are about to cancel{" "}
                    <strong>Reservation #{reservation.reservationId}</strong>
                    {reservation.car ? ` for the ${reservation.car.make} ${reservation.car.model}` : ""}.
                    This action cannot be undone.
                </p>
                <p className={styles.modalWarning}>
                    No refunds will be issued for canceled reservations.
                </p>
                <div className={styles.modalActions}>
                    <button className={styles.modalCancelBtn} onClick={onCancel} disabled={deleting}>
                        Keep Reservation
                    </button>
                    <button className={styles.modalConfirmBtn} onClick={onConfirm} disabled={deleting}>
                        {deleting ? "Canceling…" : "Yes, Cancel"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

interface Props {
    reservations: DashboardReservation[];
}

export default function ReservationsPanel({ reservations: initialReservations }: Props) {
    const { openEditReservation } = useUserDashboardStore();
    const [reservations, setReservations] = useState(initialReservations);
    const [pendingCancel, setPendingCancel] = useState<DashboardReservation | null>(null);
    const [deleting, setDeleting] = useState(false);

    const handleConfirmCancel = async () => {
        if (!pendingCancel) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/reservations/${pendingCancel.reservationId}`, { method: "DELETE" });
            if (!res.ok) throw new Error(`${res.status}`);
            setReservations((prev) => prev.filter((r) => r.reservationId !== pendingCancel.reservationId));
            setPendingCancel(null);
        } catch (e) {
            console.error("[cancelReservation]", e);
            alert("Failed to cancel reservation. Please try again.");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <>
            {pendingCancel && (
                <ConfirmCancelModal
                    reservation={pendingCancel}
                    deleting={deleting}
                    onConfirm={handleConfirmCancel}
                    onCancel={() => setPendingCancel(null)}
                />
            )}

            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className="page-title">Reservations</h1>
                    <p className="page-subtitle">{reservations.length} reservation{reservations.length !== 1 ? "s" : ""} found</p>
                </div>

                {reservations.length === 0 ? (
                    <div className={styles.emptyState}>
                        <BiReceipt className={styles.emptyIcon} />
                        <p>No reservations found.</p>
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
                                    {/* Car info */}
                                    <div className={styles.carRow}>
                                        <div className={styles.carThumb}>
                                            {r.car?.images?.[0] ? (
                                                <Image src={r.car.images[0]} alt={`${r.car.make} ${r.car.model}`}
                                                    fill className={styles.carThumbImg} sizes="80px" />
                                            ) : (
                                                <BiCar className={styles.carThumbFallback} />
                                            )}
                                        </div>
                                        <div>
                                            <p className={styles.carName}>
                                                {r.car ? `${r.car.make} ${r.car.model}` : "Unknown Vehicle"}
                                            </p>
                                            <p className={styles.carVin}>{r.car?.vin}</p>
                                        </div>
                                    </div>

                                    {/* Dates */}
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
                                                <p className={styles.infoValue}>{r.durationDays} day{r.durationDays !== 1 ? "s" : ""}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className={styles.actions}>
                                        <button className={styles.editBtn} onClick={() => openEditReservation(r)}>
                                            <BiEdit /> Edit
                                        </button>
                                        <button className={styles.cancelBtn} onClick={() => setPendingCancel(r)}>
                                            <BiX /> Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
