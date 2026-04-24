"use client";

import { useMobileSidebarStore } from "@/stores/mobileSidebarStore";
import { BiMenu } from "react-icons/bi";
import styles from "./mobileMenuButton.module.css";

const MobileMenuButton = () => {
    const setOpen = useMobileSidebarStore((s) => s.setOpen);
    return (
        <button className={styles.btn} onClick={() => setOpen(true)} aria-label="Open menu">
            <BiMenu className={styles.icon} />
        </button>
    );
};

export default MobileMenuButton;
