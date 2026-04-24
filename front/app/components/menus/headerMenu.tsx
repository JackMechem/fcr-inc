"use client";

import Link from "next/link";
import Cookies from "js-cookie";
import { useEffect } from "react";
import { useCartStore } from "@/stores/cartStore";
import { useSidebarStore } from "@/stores/sidebarStore";
import { useUserDashboardStore } from "@/stores/userDashboardStore";
import { useBookmarkStore, BookmarkCar, removeBookmark as removeBookmarkApi, clearBookmarks as clearBookmarksApi } from "@/stores/bookmarkStore";
import { useBookmarkSync } from "@/app/hooks/useBookmarkSync";
import DefaultProfilePhoto from "../defaultProfilePhoto";
import Image from "next/image";
import { BiTrash, BiGridAlt, BiError, BiUser, BiGitCompare } from "react-icons/bi";
import { CartProps } from "@/app/types/CartTypes";
import { BsCart2, BsCart3, BsBookmark, BsBookmarkFill } from "react-icons/bs";
import { IoClose } from "react-icons/io5";
import ThemeToggle from "../ThemeToggle";
import styles from "./headerMenu.module.css";
import { MdSpaceDashboard } from "react-icons/md";

const HeaderMenu = () => {
    const { openPanel, close } = useSidebarStore();
    const isOpen = openPanel === "menu";
    const {
        carData,
        removeCar,
    }: { carData: CartProps[]; removeCar: (vin: string) => void } =
        useCartStore();
    const cartCount = carData.length;

    const { isAuthenticated, sessionToken, userEmail, userName, accountId, role, clearSession, setUserEmail, setUserName } = useUserDashboardStore();
    const bookmarks = useBookmarkStore((s) => s.bookmarks);
    const bookmarkCount = bookmarks.length;

    useBookmarkSync();

    const isLoggedIn = isAuthenticated && !!sessionToken;
    const isGuest = isLoggedIn && role === "GUEST";
    const isAdmin = isLoggedIn && (role === "ADMIN" || role === "STAFF");

    useEffect(() => {
        if (isLoggedIn && !userEmail && accountId) {
            fetch(`/api/accounts/${accountId}`)
                .then((r) => r.json())
                .then((a) => {
                    console.log("headerMenu /accounts response:", a);
                    if (a?.email) setUserEmail(a.email);
                    if (a?.name) setUserName(a.name);
                })
                .catch(() => {});
        }
    }, [isLoggedIn, accountId]);

    const handleSignOut = () => {
        Cookies.remove("user-session", { path: "/" });
        Cookies.remove("account-id", { path: "/" });
        Cookies.remove("stripe-user-id", { path: "/" });
        Cookies.remove("user-role", { path: "/" });
        useBookmarkStore.getState().setBookmarks([]);
        clearSession();
        close();
    };

    // Derive display info for the profile row
    const displayName = isLoggedIn ? (userName ?? userEmail ?? "User") : null;
    const displayRole = isAdmin
        ? (role === "ADMIN" ? "Administrator" : "Staff")
        : isGuest
            ? "Guest"
            : isLoggedIn
                ? (role ?? "User")
                : "Not signed in";

    return (
        <>
            <div className={`${styles.panel} ${isOpen ? styles.panelOpen : styles.panelClosed}`}>
                {/* Header */}
                <div className={styles.headerRow}>
                    <button onClick={close} className={styles.closeBtn}>
                        <IoClose />
                    </button>
                    <p className={styles.menuTitle}>Menu</p>
                    <ThemeToggle />
                </div>

                {/* Profile section */}
                <div className={styles.profileRow}>
                    <div className={styles.avatarBorder} style={isAdmin ? { borderColor: role === "ADMIN" ? "rgba(239,68,68,0.4)" : "rgba(59,130,246,0.4)" } : undefined}>
                        {role === "ADMIN" ? (
                            <div className={styles.roleAvatar} style={{ background: "#ef4444" }}>
                                <BiError style={{ fontSize: 22, color: "#fff" }} />
                            </div>
                        ) : role === "STAFF" ? (
                            <div className={styles.roleAvatar} style={{ background: "#3b82f6" }}>
                                <BiUser style={{ fontSize: 22, color: "#fff" }} />
                            </div>
                        ) : (
                            <DefaultProfilePhoto totalHeight={48} headSize={16} />
                        )}
                    </div>
                    <div className={styles.profileInfo}>
                        <p className={styles.profileName}>
                            {displayName ?? "Not signed in"}
                        </p>
                        <p className={styles.profileRole}>{displayRole}</p>
                    </div>
                    {isLoggedIn ? (
                        <div className={styles.profileActions}>
                            <Link href="/dashboard" onClick={close} className={styles.gearBtn} title="Dashboard">
                                <MdSpaceDashboard />
                            </Link>
                            <button onClick={handleSignOut} className={styles.signOutBtn}>
                                Sign out
                            </button>
                        </div>
                    ) : (
                        <div className={styles.authBtns}>
                            <Link href="/login" onClick={close} className={styles.loginBtn}>
                                Login
                            </Link>
                        </div>
                    )}
                </div>

                {/* Cart section */}
                <div className={styles.cartSection}>
                    <div className={styles.cartHeader}>
                        <BsCart2 className={styles.cartIcon} />
                        <p className={styles.cartTitle}>Cart</p>
                        {cartCount > 0 && (
                            <span className={styles.cartCount}>
                                {cartCount} {cartCount === 1 ? "car" : "cars"}
                            </span>
                        )}
                    </div>

                    {cartCount === 0 ? (
                        <div className={styles.emptyCart}>
                            <BsCart3 className={styles.emptyCartIcon} />
                            <p className={styles.emptyCartText}>Your cart is empty</p>
                        </div>
                    ) : (
                        <>
                            <div className={styles.cartItems}>
                                {carData.map((car: CartProps) => (
                                    <div key={car.vin} className={`card ${styles.cartItem}`}>
                                        {car.image && (
                                            <Image
                                                src={car.image}
                                                alt="Car Photo"
                                                width={124}
                                                height={124}
                                                className={styles.cartItemImage}
                                            />
                                        )}
                                        <div className={styles.cartItemBody}>
                                            <div>
                                                <p className={styles.cartItemName}>
                                                    {car.make} {car.model}
                                                </p>
                                                {car.startDate && car.endDate && (
                                                    <p className={styles.cartItemDates}>
                                                        {new Date(car.startDate).toLocaleDateString("en-US", {
                                                            month: "short",
                                                            day: "numeric",
                                                        })}
                                                        {" – "}
                                                        {new Date(car.endDate).toLocaleDateString("en-US", {
                                                            month: "short",
                                                            day: "numeric",
                                                            year: "numeric",
                                                        })}
                                                    </p>
                                                )}
                                            </div>
                                            <p className={styles.cartItemPrice}>
                                                ${car.pricePerDay}
                                                <span className={styles.cartItemPriceUnit}>/day</span>
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => removeCar(car.vin)}
                                            className={styles.cartItemRemove}
                                        >
                                            <BiTrash className={styles.cartItemRemoveIcon} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <Link href="/checkout" onClick={close} className={styles.checkoutBtn}>
                                Checkout
                            </Link>
                        </>
                    )}
                </div>

                {/* Bookmarks section */}
                {isLoggedIn && (
                    <div className={styles.bookmarkSection}>
                        <div className={styles.cartHeader}>
                            <BsBookmark className={styles.cartIcon} />
                            <p className={styles.cartTitle}>Bookmarks</p>
                            {bookmarkCount > 0 && (
                                <>
                                    <span className={styles.cartCount}>
                                        {bookmarkCount} {bookmarkCount === 1 ? "car" : "cars"}
                                    </span>
                                    <button
                                        onClick={() => { if (accountId) clearBookmarksApi(accountId); }}
                                        className={styles.clearBtn}
                                    >
                                        Clear
                                    </button>
                                </>
                            )}
                        </div>

                        {bookmarkCount === 0 ? (
                            <div className={styles.emptyCart}>
                                <BsBookmark className={styles.emptyCartIcon} />
                                <p className={styles.emptyCartText}>No bookmarked cars</p>
                            </div>
                        ) : (
                            <div className={styles.cartItems}>
                                {bookmarks.map((car: BookmarkCar) => (
                                    <Link
                                        key={car.vin}
                                        href={`/car/${car.vin}`}
                                        onClick={close}
                                        className={`card ${styles.cartItem}`}
                                    >
                                        {car.image && (
                                            <Image
                                                src={car.image}
                                                alt="Car Photo"
                                                width={124}
                                                height={124}
                                                className={styles.cartItemImage}
                                            />
                                        )}
                                        <div className={styles.cartItemBody}>
                                            <p className={styles.cartItemName}>
                                                {car.make} {car.model}
                                            </p>
                                            <p className={styles.cartItemPrice}>
                                                ${car.pricePerDay}
                                                <span className={styles.cartItemPriceUnit}>/day</span>
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (accountId) removeBookmarkApi(accountId, car.vin);
                                            }}
                                            className={styles.cartItemRemove}
                                        >
                                            <BiTrash className={styles.cartItemRemoveIcon} />
                                        </button>
                                    </Link>
                                ))}
                            </div>
                        )}
                        {bookmarkCount >= 2 && (
                            <Link
                                href="/compare"
                                onClick={close}
                                className={styles.compareBtn}
                            >
                                <BiGitCompare />
                                Compare all
                            </Link>
                        )}
                    </div>
                )}

                {/* Footer */}
                <div className={styles.footer} />
            </div>

        </>
    );
};

export default HeaderMenu;
