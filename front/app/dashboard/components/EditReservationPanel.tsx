"use client";

import { useState } from "react";
import { useUserDashboardStore } from "@/stores/userDashboardStore";
import { BiCalendar, BiArrowBack } from "react-icons/bi";
import styles from "./panels.module.css";

export default function EditReservationPanel() {
    const { selectedReservation, setActiveView } = useUserDashboardStore();

    const toDatetimeLocal = (d: string | number) => {
        const ms = typeof d === "number" ? d * 1000 : d;
        return new Date(ms).toISOString().slice(0, 16);
    };

    const [pickUpTime, setPickUpTime] = useState(
        selectedReservation ? toDatetimeLocal(selectedReservation.pickUpTime) : ""
    );
    const [dropOffTime, setDropOffTime] = useState(
        selectedReservation ? toDatetimeLocal(selectedReservation.dropOffTime) : ""
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    if (!selectedReservation) {
        return (
            <div className={styles.container}>
                <p className={styles.error}>No reservation selected.</p>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/reservations/${selectedReservation.reservationId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pickUpTime: new Date(pickUpTime).toISOString(),
                    dropOffTime: new Date(dropOffTime).toISOString(),
                }),
            });

            if (!res.ok) throw new Error((await res.json()).error ?? "Failed to update reservation.");
            setSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <button className={styles.backBtn} onClick={() => setActiveView("reservations")}>
                        <BiArrowBack /> Back to Reservations
                    </button>
                    <h1 className="page-title">Edit Reservation #{selectedReservation.reservationId}</h1>
                    <p className="page-subtitle">
                        {selectedReservation.car
                            ? `${selectedReservation.car.make} ${selectedReservation.car.model}`
                            : selectedReservation.car?.vin ?? ""}
                    </p>
                </div>
            </div>

            {success ? (
                <div className={styles.successBox}>
                    <p className={styles.successText}>Reservation updated successfully.</p>
                    <button className={styles.primaryBtn} onClick={() => setActiveView("reservations")}>
                        Back to Reservations
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formSection}>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>
                                <BiCalendar className={styles.labelIcon} /> Pick Up Time
                            </label>
                            <input
                                type="datetime-local"
                                className={styles.input}
                                value={pickUpTime}
                                onChange={(e) => setPickUpTime(e.target.value)}
                                required
                            />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>
                                <BiCalendar className={styles.labelIcon} /> Drop Off Time
                            </label>
                            <input
                                type="datetime-local"
                                className={styles.input}
                                value={dropOffTime}
                                min={pickUpTime}
                                onChange={(e) => setDropOffTime(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {error && <p className={styles.error}>{error}</p>}

                    <button type="submit" className={styles.primaryBtn} disabled={loading}>
                        {loading ? "Saving..." : "Save Changes"}
                    </button>
                </form>
            )}
        </div>
    );
}
