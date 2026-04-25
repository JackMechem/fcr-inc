"use client";

import { useSidebarStore } from "@/stores/sidebarStore";
import { useBookmarkStore } from "@/stores/bookmarkStore";
import { useUserDashboardStore } from "@/stores/userDashboardStore";
import { BsBookmark } from "react-icons/bs";
import { BiUser } from "react-icons/bi";
import CartButton from "./cartButton";
import DefaultProfilePhoto from "../defaultProfilePhoto";
import styles from "./headerMenuButton.module.css";

const HeaderMenuButton = () => {
    const { toggleMenu } = useSidebarStore();
    const bookmarkCount = useBookmarkStore((s) => s.bookmarks.length);
    const { isAuthenticated, role } = useUserDashboardStore();

    return (
        <div className={styles.button} onClick={toggleMenu}>
            <CartButton />
            {isAuthenticated && (
                <div className={styles.iconWrapper}>
                    <BsBookmark />
                    {bookmarkCount > 0 && (
                        <div className={styles.badge}>{bookmarkCount}</div>
                    )}
                </div>
            )}
            {role === "ADMIN" ? (
                <div className={styles.rolePill} style={{ background: "#ef4444" }}>
                    <BiUser style={{ fontSize: 14, color: "#fff" }} />
                    <span className={styles.rolePillText}>Admin</span>
                </div>
            ) : role === "STAFF" ? (
                <div className={styles.rolePill} style={{ background: "#3b82f6" }}>
                    <BiUser style={{ fontSize: 14, color: "#fff" }} />
                    <span className={styles.rolePillText}>Staff</span>
                </div>
            ) : (
                <DefaultProfilePhoto totalHeight={30} headSize={10} />
            )}
        </div>
    );
};

export default HeaderMenuButton;
