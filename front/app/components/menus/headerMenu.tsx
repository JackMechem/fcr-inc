"use client";

import Link from "next/link";
import Cookies from "js-cookie";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useCartStore } from "@/stores/cartStore";
import { useSidebarStore } from "@/stores/sidebarStore";
import { useUserDashboardStore } from "@/stores/userDashboardStore";
import { useBookmarkStore, BookmarkCar, removeBookmark as removeBookmarkApi, clearBookmarks as clearBookmarksApi } from "@/stores/bookmarkStore";
import { useBookmarkSync } from "@/app/hooks/useBookmarkSync";
import DefaultProfilePhoto from "../defaultProfilePhoto";
import Image from "next/image";
import { BiTrash, BiUser, BiGitCompare, BiTerminal, BiPlus, BiCheck, BiChevronDown, BiChevronUp, BiLogOut } from "react-icons/bi";
import { CartProps } from "@/app/types/CartTypes";
import { BsCart2, BsCart3, BsBookmark, BsPeopleFill } from "react-icons/bs";
import { IoClose } from "react-icons/io5";
import ThemeToggle from "../ThemeToggle";
import styles from "./headerMenu.module.css";
import { MdSpaceDashboard } from "react-icons/md";

const ROLE_COLOR: Record<string, string> = {
    ADMIN: "#ef4444",
    STAFF: "#3b82f6",
};

const HeaderMenu = () => {
    const { openPanel, close, openDevConsole } = useSidebarStore();
    const isOpen = openPanel === "menu";
    const router = useRouter();
    const { carData, removeCar }: { carData: CartProps[]; removeCar: (vin: string) => void } = useCartStore();
    const cartCount = carData.length;

    const { isAuthenticated, sessionToken, userEmail, userName, accountId, role, clearSession, clearAllSessions, setUserEmail, setUserName, sessions, activeSessionIndex, switchSession, removeSession } = useUserDashboardStore();
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
                    if (a?.email) setUserEmail(a.email);
                    if (a?.name) setUserName(a.name);
                })
                .catch(() => {});
        }
    }, [isLoggedIn, accountId]);

    const applySessionCookies = (token: string, accountId: number, role: string, expiresAt: string, stripeUserId?: number | null) => {
        const exp = new Date(expiresAt);
        Cookies.set("user-session", token, { path: "/", expires: exp });
        Cookies.set("account-id", String(accountId), { path: "/", expires: exp });
        Cookies.set("user-role", role, { path: "/", expires: exp });
        if (stripeUserId != null) {
            Cookies.set("stripe-user-id", String(stripeUserId), { path: "/", expires: exp });
        } else {
            Cookies.remove("stripe-user-id", { path: "/" });
        }
    };

    const handleSignOut = () => {
        Cookies.remove("user-session", { path: "/" });
        Cookies.remove("account-id", { path: "/" });
        Cookies.remove("stripe-user-id", { path: "/" });
        Cookies.remove("user-role", { path: "/" });
        useBookmarkStore.getState().setBookmarks([]);
        clearSession();
        close();
    };

    const handleAddAccount = () => {
        sessionStorage.setItem("add-account", "1");
        close();
        router.push("/login");
    };

    const [cartOpen, setCartOpen] = useState(true);
    const [bookmarksOpen, setBookmarksOpen] = useState(true);

    // Account switcher popup
    const [acctMenuOpen, setAcctMenuOpen] = useState(false);
    const acctBtnRef = useRef<HTMLButtonElement>(null);
    const acctMenuRef = useRef<HTMLDivElement>(null);
    const [acctMenuPos, setAcctMenuPos] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (!acctMenuOpen) return;
        const handler = (e: MouseEvent) => {
            if (acctMenuRef.current?.contains(e.target as Node) || acctBtnRef.current?.contains(e.target as Node)) return;
            setAcctMenuOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [acctMenuOpen]);

    const openAcctMenu = () => {
        if (!acctBtnRef.current) return;
        const rect = acctBtnRef.current.getBoundingClientRect();
        setAcctMenuPos({ top: rect.bottom + 4, left: rect.right });
        setAcctMenuOpen(o => !o);
    };

    const displayName = isLoggedIn ? (userName ?? userEmail ?? "User") : null;
    const displayRole = isAdmin
        ? (role === "ADMIN" ? "Administrator" : "Staff")
        : isGuest ? "Guest"
        : isLoggedIn ? (role ?? "User")
        : "Not signed in";

    return (
        <>
            <div className={`${styles.panel} ${isOpen ? styles.panelOpen : styles.panelClosed}`}>
                {/* Header */}
                <div className={styles.headerRow}>
                    <button onClick={close} className={styles.closeBtn}><IoClose /></button>
                    <p className={styles.menuTitle}>Menu</p>
                    <ThemeToggle />
                </div>

                {/* Profile section */}
                <div className={styles.profileRow}>
                    <div className={styles.avatarBorder} style={isAdmin ? { borderColor: role === "ADMIN" ? "rgba(239,68,68,0.4)" : "rgba(59,130,246,0.4)" } : undefined}>
                        {role === "ADMIN" ? (
                            <div className={styles.roleAvatar} style={{ background: "#ef4444" }}>
                                <BiUser style={{ fontSize: 22, color: "#fff" }} />
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
                        <p className={styles.profileName}>{displayName ?? "Not signed in"}</p>
                        <p className={styles.profileRole}>{displayRole}</p>
                        {isLoggedIn ? (
                            <div className={styles.profileActions}>
                                <Link href="/dashboard" onClick={close} className={styles.gearBtn} title="Dashboard">
                                    <MdSpaceDashboard />
                                </Link>
                                {role === "ADMIN" && (
                                    <button onClick={() => { close(); setTimeout(openDevConsole, 50); }} className={styles.gearBtn} title="Dev Console">
                                        <BiTerminal />
                                    </button>
                                )}
                                {isAdmin && (
                                    <button ref={acctBtnRef} onClick={openAcctMenu} className={`${styles.gearBtn} ${acctMenuOpen ? styles.gearBtnActive : ""}`} title="Switch account">
                                        <BsPeopleFill />
                                    </button>
                                )}
                                <button onClick={handleSignOut} className={styles.gearBtn} title="Sign out" style={{ color: "var(--color-accent)" }}>
                                    <BiLogOut />
                                </button>
                            </div>
                        ) : (
                            <div className={styles.authBtns}>
                                <Link href="/login" onClick={close} className={styles.loginBtn}>Login</Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Account switcher popup */}
                {acctMenuOpen && createPortal(
                    <div
                        ref={acctMenuRef}
                        className={styles.acctMenu}
                        style={{ top: acctMenuPos.top, left: acctMenuPos.left, transform: "translateX(-100%)" }}
                    >
                        {sessions.map((s, i) => {
                            const active = i === activeSessionIndex;
                            const color = ROLE_COLOR[s.role] ?? "var(--color-foreground-light)";
                            const label = s.userName || s.userEmail || `#${s.accountId}`;
                            return (
                                <div
                                    key={s.accountId}
                                    className={`${styles.acctMenuItem} ${active ? styles.acctMenuItemActive : ""}`}
                                    onClick={() => {
                                        if (!active) {
                                            switchSession(i);
                                            applySessionCookies(s.token, s.accountId, s.role, s.sessionExpiresAt, s.stripeUserId);
                                            setAcctMenuOpen(false);
                                        }
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => { if (e.key === "Enter" && !active) { switchSession(i); setAcctMenuOpen(false); } }}
                                >
                                    <div className={styles.acctMenuAvatar} style={{ background: color }}>
                                        <BiUser style={{ color: "#fff", fontSize: 11 }} />
                                    </div>
                                    <div className={styles.acctMenuInfo}>
                                        <div className={styles.acctMenuName}>{label}</div>
                                        <div className={styles.acctMenuRole} style={{ color }}>{s.role}</div>
                                    </div>
                                    {active && <BiCheck style={{ color, fontSize: 16, flexShrink: 0 }} />}
                                    {!active && (
                                        <button className={styles.acctMenuRemove} onClick={(e) => { e.stopPropagation(); removeSession(i); }} title="Remove">
                                            <IoClose />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                        <div className={styles.acctMenuDivider} />
                        <button className={styles.acctMenuItem} onClick={() => { handleAddAccount(); setAcctMenuOpen(false); }}>
                            <BiPlus style={{ fontSize: 16, flexShrink: 0 }} /> Add account
                        </button>
                        {sessions.length > 1 && (
                            <button className={`${styles.acctMenuItem} ${styles.acctMenuDanger}`} onClick={() => { clearAllSessions(); setAcctMenuOpen(false); close(); }}>
                                <IoClose style={{ fontSize: 16, flexShrink: 0 }} /> Sign out all
                            </button>
                        )}
                    </div>,
                    document.body
                )}

                {/* Cart section */}
                <div className={`${styles.cartSection} ${styles.cartSectionBorderTop}`}>
                    <button className={styles.cartHeader} onClick={() => setCartOpen(o => !o)}>
                        <BsCart2 className={styles.cartIcon} />
                        <p className={styles.cartTitle}>Cart</p>
                        {cartCount > 0 && <span className={styles.cartCount}>{cartCount} {cartCount === 1 ? "car" : "cars"}</span>}
                        <span className={styles.cartHeaderSpacer} />
                        {cartOpen ? <BiChevronUp className={styles.collapseIcon} /> : <BiChevronDown className={styles.collapseIcon} />}
                    </button>
                    {cartOpen && (cartCount === 0 ? (
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
                                            <Image src={car.image} alt="Car Photo" width={124} height={124} className={styles.cartItemImage} />
                                        )}
                                        <div className={styles.cartItemBody}>
                                            <div>
                                                <p className={styles.cartItemName}>{car.make} {car.model}</p>
                                                {car.startDate && car.endDate && (
                                                    <p className={styles.cartItemDates}>
                                                        {new Date(car.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                                        {" – "}
                                                        {new Date(car.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                    </p>
                                                )}
                                            </div>
                                            <p className={styles.cartItemPrice}>
                                                ${car.pricePerDay}
                                                <span className={styles.cartItemPriceUnit}>/day</span>
                                            </p>
                                        </div>
                                        <button onClick={() => removeCar(car.vin)} className={styles.cartItemRemove}>
                                            <BiTrash className={styles.cartItemRemoveIcon} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <Link href="/checkout" onClick={close} className={styles.checkoutBtn}>Checkout</Link>
                        </>
                    ))}
                </div>

                {/* Bookmarks section */}
                {isLoggedIn && (
                    <div className={styles.bookmarkSection}>
                        <div className={styles.cartHeader}>
                            <button className={styles.cartHeaderBtn} onClick={() => setBookmarksOpen(o => !o)}>
                                <BsBookmark className={styles.cartIcon} />
                                <p className={styles.cartTitle}>Bookmarks</p>
                                {bookmarkCount > 0 && <span className={styles.cartCount}>{bookmarkCount} {bookmarkCount === 1 ? "car" : "cars"}</span>}
                                <span className={styles.cartHeaderSpacer} />
                            </button>
                            {bookmarkCount > 0 && (
                                <button onClick={() => { if (accountId) clearBookmarksApi(accountId); }} className={styles.clearBtn}>
                                    Clear
                                </button>
                            )}
                            <button className={styles.cartHeaderBtn} onClick={() => setBookmarksOpen(o => !o)}>
                                {bookmarksOpen ? <BiChevronUp className={styles.collapseIcon} /> : <BiChevronDown className={styles.collapseIcon} />}
                            </button>
                        </div>
                        {bookmarksOpen && (bookmarkCount === 0 ? (
                            <div className={styles.emptyCart}>
                                <BsBookmark className={styles.emptyCartIcon} />
                                <p className={styles.emptyCartText}>No bookmarked cars</p>
                            </div>
                        ) : (
                            <div className={styles.cartItems}>
                                {bookmarks.map((car: BookmarkCar) => (
                                    <Link key={car.vin} href={`/car/${car.vin}`} onClick={close} className={`card ${styles.cartItem}`}>
                                        {car.image && (
                                            <Image src={car.image} alt="Car Photo" width={124} height={124} className={styles.cartItemImage} />
                                        )}
                                        <div className={styles.cartItemBody}>
                                            <p className={styles.cartItemName}>{car.make} {car.model}</p>
                                            <p className={styles.cartItemPrice}>
                                                ${car.pricePerDay}
                                                <span className={styles.cartItemPriceUnit}>/day</span>
                                            </p>
                                        </div>
                                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (accountId) removeBookmarkApi(accountId, car.vin); }} className={styles.cartItemRemove}>
                                            <BiTrash className={styles.cartItemRemoveIcon} />
                                        </button>
                                    </Link>
                                ))}
                            </div>
                        ))}
                        {bookmarksOpen && bookmarkCount >= 2 && (
                            <Link href="/compare" onClick={close} className={styles.compareBtn}>
                                <BiGitCompare /> Compare all
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
