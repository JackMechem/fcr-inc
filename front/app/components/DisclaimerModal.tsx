"use client";

import { useState, useEffect } from "react";
import styles from "./DisclaimerModal.module.css";

const STORAGE_KEY = "fcr_disclaimer_acknowledged";

const DisclaimerModal = () => {
    const [visible, setVisible] = useState(false);
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    }, []);

    const acknowledge = () => {
        if (!checked) return;
        localStorage.setItem(STORAGE_KEY, "true");
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <span className={styles.badge}>Demo Project</span>
                    <h2 className={styles.title}>Before You Continue</h2>
                </div>

                <div className={styles.body}>
                    <p className={styles.lead}>
                        <strong>FCR — Fast Car Rentals is not a real business.</strong> This is a
                        student course project built for educational purposes only.
                    </p>

                    <ul className={styles.list}>
                        <li>
                            <strong>No real transactions.</strong> Any prices, reservations, or
                            payment flows shown are entirely fictional. No money will be charged.
                            When prompted for a card, use the test number{" "}
                            <code>4242 4242 4242 4242</code> with any future expiry and any 3-digit
                            CVC.
                        </li>
                        <li>
                            <strong>Images are sourced from the internet</strong> and remain the
                            property of their respective owners. They are used here without claim of
                            ownership solely for demonstration purposes.
                        </li>
                        <li>
                            <strong>No real cars are available for rent.</strong> Vehicle listings,
                            specs, and availability are fabricated data.
                        </li>
                        <li>
                            <strong>Any personal information</strong> you enter (name, email, etc.)
                            is stored only for demo functionality and is not shared with any third
                            party.
                        </li>
                    </ul>

                    <label className={styles.checkRow}>
                        <input
                            type="checkbox"
                            className={styles.checkbox}
                            checked={checked}
                            onChange={(e) => setChecked(e.target.checked)}
                        />
                        <span className={styles.checkLabel}>
                            By continuing, I acknowledge that this site is a non-commercial student
                            project and agree not to rely on any information displayed here for real
                            purchasing or rental decisions.
                        </span>
                    </label>
                </div>

                <button className={`${styles.btn} ${!checked ? styles.btnDisabled : ""}`} onClick={acknowledge}>
                    I Understand — Continue
                </button>
            </div>
        </div>
    );
};

export default DisclaimerModal;
