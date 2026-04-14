"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BiCheckCircle, BiX } from "react-icons/bi";
import { useCartStore } from "@/stores/cartStore";
import styles from "./PaymentSuccessDialog.module.css";

export default function PaymentSuccessDialog() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { clearCart } = useCartStore();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (searchParams.get("payment") === "success") {
            clearCart();
            setVisible(true);
        }
    }, [searchParams]);

    const dismiss = () => {
        setVisible(false);
        router.replace("/", { scroll: false });
    };

    if (!visible) return null;

    return (
        <div className={styles.overlay} onClick={dismiss}>
            <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={dismiss}>
                    <BiX />
                </button>
                <BiCheckCircle className={styles.icon} />
                <h2 className={styles.title}>Payment Successful!</h2>
                <p className={styles.message}>
                    Your reservation has been confirmed. Check your email for booking details.
                </p>
                <button className={styles.doneBtn} onClick={dismiss}>
                    Done
                </button>
            </div>
        </div>
    );
}
