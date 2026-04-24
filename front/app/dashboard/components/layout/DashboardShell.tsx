"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ReservationsPanel from "../panels/ReservationsPanel";
import EditReservationPanel from "../panels/EditReservationPanel";
import UserDetailsPanel from "../panels/UserDetailsPanel";
import AdminContentWrapper, { isAdminView } from "./AdminContentWrapper";
import { useUserDashboardStore } from "@/stores/userDashboardStore";
import { useCartStore } from "@/stores/cartStore";
import { BiCheckCircle, BiX } from "react-icons/bi";
import styles from "../../dashboard.module.css";

interface Props {
    paymentSuccess: boolean;
    editCarVin?: string;
}

export default function DashboardShell({ paymentSuccess: initialPaymentSuccess, editCarVin }: Props) {
    const { activeView, isAuthenticated, openEditCar } = useUserDashboardStore();
    const { clearCart } = useCartStore();
    const router = useRouter();
    const [paymentSuccess, setPaymentSuccess] = useState(initialPaymentSuccess);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (mounted && editCarVin) {
            openEditCar(editCarVin);
            router.replace("/dashboard", { scroll: false });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mounted, editCarVin]);

    useEffect(() => {
        if (mounted && !isAuthenticated) {
            router.replace("/login?next=/dashboard");
        }
    }, [mounted, isAuthenticated]);

    useEffect(() => {
        if (initialPaymentSuccess) {
            clearCart();
            router.replace("/dashboard", { scroll: false });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Don't render anything until Zustand has hydrated from localStorage
    if (!mounted || !isAuthenticated) return null;

    const renderPanel = () => {
        if (isAdminView(activeView)) return <AdminContentWrapper />;
        switch (activeView) {
            case "edit-reservation": return <EditReservationPanel />;
            case "user-details":     return <UserDetailsPanel />;
            default:                 return <ReservationsPanel />;
        }
    };

    return (
        <>
            {paymentSuccess && (
                <div className={styles.successBanner}>
                    <div className={styles.successBannerLeft}>
                        <BiCheckCircle className={styles.successBannerIcon} />
                        <span>Payment successful! Your reservation has been confirmed.</span>
                    </div>
                    <button onClick={() => setPaymentSuccess(false)} className={styles.successBannerClose}>
                        <BiX />
                    </button>
                </div>
            )}
            {renderPanel()}
        </>
    );
}
