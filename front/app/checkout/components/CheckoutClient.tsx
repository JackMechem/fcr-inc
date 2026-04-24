"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import NavHeader from "../../components/headers/navHeader";
import MainBodyContainer from "../../components/containers/mainBodyContainer";
import { useCartStore } from "@/stores/cartStore";
import { lookupUserByEmail, checkAccountExists, createPaymentIntent } from "../clientActions";
import { CartProps } from "../../types/CartTypes";
import { BiCar, BiCalendar, BiTrash, BiUser, BiLogIn, BiInfoCircle } from "react-icons/bi";
import styles from "../checkout.module.css";

// ── Helpers ───────────────────────────────────────────────────────────────────

const daysBetween = (start?: string, end?: string): number => {
    if (!start || !end) return 1;
    const ms = new Date(end).getTime() - new Date(start).getTime();
    return Math.ceil(ms / (1000 * 60 * 60 * 24)) + 1;
};

const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

const toUnixSeconds = (dateStr: string) =>
    Math.floor(new Date(dateStr).getTime() / 1000);

interface UserInfo {
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    buildingNumber: string;
    streetName: string;
    city: string;
    state: string;
    zipCode: string;
    licenseNumber: string;
    licenseState: string;
    expirationDate: string;
    dateOfBirth: string;
}

const emptyInfo = (): UserInfo => ({
    email: "", firstName: "", lastName: "", phoneNumber: "",
    buildingNumber: "", streetName: "", city: "", state: "", zipCode: "",
    licenseNumber: "", licenseState: "", expirationDate: "", dateOfBirth: "",
});

const mapUserToInfo = (user: Record<string, unknown>): UserInfo => {
    const addr = user.address as Record<string, unknown> | null ?? {};
    const lic = user.driversLicense as Record<string, unknown> | null ?? {};
    return {
        email: (user.email as string) ?? "",
        firstName: (user.firstName as string) ?? "",
        lastName: (user.lastName as string) ?? "",
        phoneNumber: (user.phoneNumber as string) ?? "",
        buildingNumber: (addr.buildingNumber as string) ?? "",
        streetName: (addr.streetName as string) ?? "",
        city: (addr.city as string) ?? "",
        state: (addr.state as string) ?? "",
        zipCode: (addr.zipCode as string) ?? "",
        licenseNumber: (lic.driversLicense as string) ?? "",
        licenseState: (lic.state as string) ?? "",
        expirationDate: lic.expirationDate
            ? new Date((lic.expirationDate as number) * 1000).toISOString().split("T")[0]
            : "",
        dateOfBirth: lic.dateOfBirth
            ? new Date((lic.dateOfBirth as number) * 1000).toISOString().split("T")[0]
            : "",
    };
};

const isInfoComplete = (info: UserInfo) =>
    !!(info.email && info.firstName && info.lastName && info.phoneNumber &&
        info.buildingNumber && info.streetName && info.city && info.state && info.zipCode &&
        info.licenseNumber && info.licenseState && info.expirationDate && info.dateOfBirth);

// ── Cart item row ─────────────────────────────────────────────────────────────

const CartItemRow = ({ item, onRemove }: { item: CartProps; onRemove: () => void }) => {
    const days = daysBetween(item.startDate, item.endDate);
    const subtotal = item.pricePerDay * days;

    return (
        <div className={styles.cartItemRow}>
            <div className={styles.cartItemThumb}>
                {item.image ? (
                    <Image src={item.image} alt={`${item.make} ${item.model}`} fill className="object-cover" sizes="100px"
                        onError={(e) => (e.currentTarget.style.display = "none")} />
                ) : (
                    <div className={styles.cartItemNoImage}>
                        <BiCar className={styles.cartItemNoImageIcon} />
                    </div>
                )}
            </div>

            <div className={styles.cartItemDetails}>
                <div className={styles.cartItemTop}>
                    <div>
                        <p className={styles.cartItemName}>{item.make} {item.model}</p>
                        <p className={styles.cartItemVin}>{item.vin}</p>
                    </div>
                    <button onClick={onRemove} className={styles.cartItemRemoveBtn}>
                        <BiTrash />
                    </button>
                </div>

                <div className={styles.cartItemDates}>
                    <BiCalendar className={styles.cartItemDateIcon} />
                    <span>{fmtDate(item.startDate)} — {fmtDate(item.endDate)}</span>
                    <span className={styles.cartItemDotSep}>·</span>
                    <span>{days} day{days !== 1 ? "s" : ""}</span>
                </div>

                <div className={styles.cartItemPriceRow}>
                    <p className={styles.cartItemPriceDay}>${item.pricePerDay}/day</p>
                    <p className={styles.cartItemSubtotal}>${subtotal.toLocaleString()}</p>
                </div>
            </div>
        </div>
    );
};

// ── Section card ──────────────────────────────────────────────────────────────

const SectionCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <div className={styles.sectionCard}>
        <div className={styles.sectionCardHeader}>
            <span className={styles.sectionCardIcon}>{icon}</span>
            <p className={styles.sectionCardTitle}>{title}</p>
        </div>
        {children}
    </div>
);

// ── Stripe payment form ───────────────────────────────────────────────────────

const StripePaymentForm = ({ onError }: { onError: (msg: string) => void }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;
        setLoading(true);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/dashboard?payment=success`,
            },
        });

        if (error) {
            onError(error.message ?? "Payment failed. Please try again.");
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className={styles.paymentElement}>
                <PaymentElement />
            </div>
            <button type="submit" disabled={!stripe || loading} className={styles.confirmBtn}>
                {loading ? "Processing..." : "Pay Now"}
            </button>
        </form>
    );
};

// ── Guest banner ──────────────────────────────────────────────────────────────

const GuestBanner = () => (
    <div className={styles.guestBanner}>
        <BiInfoCircle className={styles.guestBannerIcon} />
        <div>
            <p className={styles.guestBannerTitle}>Checking out as Guest</p>
            <p className={styles.guestBannerNote}>
                Guests cannot view reservations online. A confirmation email will be sent to you after booking.
            </p>
        </div>
    </div>
);

// ── Guest email lookup step ───────────────────────────────────────────────────

const GuestEmailStep = ({
    onFound,
}: {
    onFound: (email: string, prefill: UserInfo, userFound: boolean) => void;
}) => {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const user = await lookupUserByEmail(email);

            if (user) {
                const { exists } = await checkAccountExists(email);
                if (exists) {
                    router.push(`/login?reason=account_exists&email=${encodeURIComponent(email)}`);
                    return;
                }
                onFound(email, mapUserToInfo({ ...user, email: (user.email as string) ?? email }), true);
            } else {
                onFound(email, { ...emptyInfo(), email }, false);
            }
        } catch {
            setError("Could not reach the server. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.infoFormGrid}>
            <div className={styles.infoSection}>
                <p className={styles.infoSectionTitle}>Guest Checkout</p>
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Email</label>
                    <input
                        type="email"
                        className={styles.input}
                        placeholder="john@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoFocus
                    />
                </div>
                {error && <p className={styles.errorNote}>{error}</p>}
                <button type="submit" className={styles.confirmBtn} disabled={loading}>
                    {loading ? "Looking up..." : "Continue"}
                </button>
            </div>
        </form>
    );
};

// ── Guest / info form ─────────────────────────────────────────────────────────

const InfoForm = ({
    initial,
    onSubmit,
    loading,
    error,
    disabled = false,
}: {
    initial: UserInfo;
    onSubmit: (info: UserInfo) => void;
    loading: boolean;
    error: string | null;
    disabled?: boolean;
}) => {
    const [form, setForm] = useState<UserInfo>(initial);
    const set = (key: keyof UserInfo) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((prev) => ({ ...prev, [key]: e.target.value }));

    const inputClass = `${styles.input}${disabled ? ` ${styles.inputDisabled}` : ""}`;

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}>
            {disabled && (
                <p className={styles.disabledFieldsNote}>
                    Your information was found on file and cannot be edited here.{" "}
                    <Link href="/register" className={styles.disabledFieldsLink}>Create a full account</Link>{" "}
                    to manage your details.
                </p>
            )}
            <div className={styles.infoFormGrid}>

                {/* ── Contact ── */}
                <div className={styles.infoSection}>
                    <p className={styles.infoSectionTitle}>Contact</p>
                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>Email</label>
                        <input type="email" className={inputClass} placeholder="john@example.com"
                            value={form.email} onChange={set("email")} required disabled={disabled} readOnly={disabled} />
                    </div>
                    <div className={styles.inputGrid2}>
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}>First Name</label>
                            <input className={inputClass} placeholder="John"
                                value={form.firstName} onChange={set("firstName")} required disabled={disabled} readOnly={disabled} />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}>Last Name</label>
                            <input className={inputClass} placeholder="Doe"
                                value={form.lastName} onChange={set("lastName")} required disabled={disabled} readOnly={disabled} />
                        </div>
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>Phone</label>
                        <input type="tel" className={inputClass} placeholder="555-555-5555"
                            value={form.phoneNumber} onChange={set("phoneNumber")} required disabled={disabled} readOnly={disabled} />
                    </div>
                </div>

                {/* ── Address ── */}
                <div className={styles.infoSection}>
                    <p className={styles.infoSectionTitle}>Address</p>
                    <div className={styles.inputGrid2}>
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}>Building Number</label>
                            <input className={inputClass} placeholder="123"
                                value={form.buildingNumber} onChange={set("buildingNumber")} required disabled={disabled} readOnly={disabled} />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}>Street Name</label>
                            <input className={inputClass} placeholder="Main St"
                                value={form.streetName} onChange={set("streetName")} required disabled={disabled} readOnly={disabled} />
                        </div>
                    </div>
                    <div className={styles.inputGrid2}>
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}>City</label>
                            <input className={inputClass} placeholder="Springfield"
                                value={form.city} onChange={set("city")} required disabled={disabled} readOnly={disabled} />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}>State</label>
                            <input className={inputClass} placeholder="IL" maxLength={2}
                                value={form.state} onChange={set("state")} required disabled={disabled} readOnly={disabled} />
                        </div>
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>Zip Code</label>
                        <input className={inputClass} placeholder="62701"
                            value={form.zipCode} onChange={set("zipCode")} required disabled={disabled} readOnly={disabled} />
                    </div>
                </div>

                {/* ── Driver's License ── */}
                <div className={styles.infoSection}>
                    <p className={styles.infoSectionTitle}>Driver&apos;s License</p>
                    <div className={styles.inputGrid2}>
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}>License Number</label>
                            <input className={inputClass} placeholder="D1234567"
                                value={form.licenseNumber} onChange={set("licenseNumber")} required disabled={disabled} readOnly={disabled} />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}>State</label>
                            <input className={inputClass} placeholder="IL" maxLength={2}
                                value={form.licenseState} onChange={set("licenseState")} required disabled={disabled} readOnly={disabled} />
                        </div>
                    </div>
                    <div className={styles.inputGrid2}>
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}>Expiration Date</label>
                            <input type="date" className={inputClass}
                                value={form.expirationDate} onChange={set("expirationDate")} required disabled={disabled} readOnly={disabled} />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}>Date of Birth</label>
                            <input type="date" className={inputClass}
                                value={form.dateOfBirth} onChange={set("dateOfBirth")} required disabled={disabled} readOnly={disabled} />
                        </div>
                    </div>
                </div>

            </div>

            {error && <p className={styles.errorNote} style={{ marginTop: 12 }}>{error}</p>}

            <button type="submit" className={styles.confirmBtn} style={{ marginTop: 20 }} disabled={loading}>
                {loading ? "Loading..." : "Continue to Payment"}
            </button>
        </form>
    );
};

// ── Order summary sidebar ─────────────────────────────────────────────────────

const OrderSummary = ({
    carData,
    subtotals,
    subtotal,
    tax,
    total,
    error,
    clientSecret,
    stripePromise,
    loading,
    onProceed,
    onError,
}: {
    carData: CartProps[];
    subtotals: number[];
    subtotal: number;
    tax: number;
    total: number;
    error: string | null;
    clientSecret: string | null;
    stripePromise: Promise<Stripe | null> | null;
    loading: boolean;
    onProceed: () => void;
    onError: (msg: string) => void;
}) => (
    <div className={styles.summaryCol}>
        <p className={styles.summaryTitle}>Order Summary</p>

        <div className={styles.summaryItems}>
            {carData.map((item, i) => {
                const days = daysBetween(item.startDate, item.endDate);
                return (
                    <div key={item.vin} className={styles.summaryItem}>
                        <div className={styles.summaryItemLeft}>
                            <p className={styles.summaryItemName}>{item.make} {item.model}</p>
                            <p className={styles.summaryItemDays}>{days}d × ${item.pricePerDay}/day</p>
                        </div>
                        <p className={styles.summaryItemPrice}>${subtotals[i].toLocaleString()}</p>
                    </div>
                );
            })}
        </div>

        <div className={styles.summaryTotals}>
            <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <span>${subtotal.toLocaleString()}</span>
            </div>
            <div className={styles.summaryRow}>
                <span>Tax (8%)</span>
                <span>${tax.toLocaleString()}</span>
            </div>
            <div className={styles.summaryTotalRow}>
                <span>Total</span>
                <span className={styles.summaryTotalAmount}>${total.toLocaleString()}</span>
            </div>
        </div>

        {error && <p className={styles.errorNote}>{error}</p>}

        {clientSecret && stripePromise ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
                <StripePaymentForm onError={onError} />
            </Elements>
        ) : (
            <button className={styles.confirmBtn} disabled={loading} onClick={onProceed}>
                {loading ? "Loading..." : "Proceed to Payment"}
            </button>
        )}

        <p className={styles.termsNote}>
            By confirming, you agree to our terms of service and rental policy.
        </p>
    </div>
);

// ── Main client component ─────────────────────────────────────────────────────

interface Props {
    isAuthenticated: boolean;
    initialUser: Record<string, unknown> | null;
}

type Mode = "choose" | "guest-form" | "checkout";

export default function CheckoutClient({ isAuthenticated, initialUser }: Props) {
    const router = useRouter();
    const { carData, removeCar } = useCartStore();

    const profileInfo = initialUser ? mapUserToInfo(initialUser) : null;
    const profileComplete = profileInfo ? isInfoComplete(profileInfo) : false;

    const initialMode: Mode = !isAuthenticated ? "choose" : "checkout";
    const [mode, setMode] = useState<Mode>(initialMode);
    const [guestStep, setGuestStep] = useState<"email" | "info">("email");
    const [guestPrefill, setGuestPrefill] = useState<UserInfo | null>(null);
    const [guestUserFound, setGuestUserFound] = useState(false);
    const [guestInfo, setGuestInfo] = useState<UserInfo | null>(null);

    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const subtotals = carData.map((item) => item.pricePerDay * daysBetween(item.startDate, item.endDate));
    const subtotal = subtotals.reduce((a, b) => a + b, 0);
    const tax = Math.round(subtotal * 0.08);
    const total = subtotal + tax;

    const buildUserInfoPayload = (info: UserInfo) => ({
        email: info.email,
        firstName: info.firstName,
        lastName: info.lastName,
        phoneNumber: info.phoneNumber,
        address: {
            buildingNumber: info.buildingNumber,
            streetName: info.streetName,
            city: info.city,
            state: info.state,
            zipCode: info.zipCode,
        },
        driversLicense: {
            driversLicense: info.licenseNumber,
            state: info.licenseState,
            expirationDate: info.expirationDate ? toUnixSeconds(info.expirationDate) : 0,
            dateOfBirth: info.dateOfBirth ? toUnixSeconds(info.dateOfBirth) : 0,
        },
    });

    const handleProceed = async () => {
        setLoading(true);
        setError(null);

        const info = guestInfo ?? profileInfo;

        try {
            const res = await createPaymentIntent({
                userInfo: info ? buildUserInfoPayload(info) : null,
                cars: carData.map((item) => ({
                    vin: item.vin,
                    pickUpTime: item.startDate ? new Date(item.startDate).toISOString() : "",
                    dropOffTime: item.endDate ? new Date(item.endDate).toISOString() : "",
                })),
            });

            setStripePromise(loadStripe(res.publishableKey));
            setClientSecret(res.clientSecret);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleGuestEmailFound = (email: string, prefill: UserInfo, userFound: boolean) => {
        setGuestPrefill({ ...prefill, email });
        setGuestUserFound(userFound);
        setGuestStep("info");
    };

    const handleGuestSubmit = (info: UserInfo) => {
        setGuestInfo(info);
        setMode("checkout");
    };

    const handleGuestBack = () => {
        setGuestStep("email");
        setGuestPrefill(null);
        setGuestUserFound(false);
    };

    return (
        <>
            <NavHeader white={false} />
            <div className={styles.pageWrapper}>
                <MainBodyContainer>
                    <div className={styles.inner}>
                        <h1 className={`page-title ${styles.heading}`}>Checkout</h1>
                        <p className={`page-subtitle ${styles.subheading}`}>
                            {carData.length} vehicle{carData.length !== 1 ? "s" : ""} in your reservation
                        </p>

                        {carData.length === 0 ? (
                            <div className={styles.emptyState}>
                                <BiCar className={styles.emptyIcon} />
                                <p className={styles.emptyText}>Your cart is empty.</p>
                            </div>

                        ) : mode === "choose" ? (
                            /* ── Unauthenticated: choose how to proceed ── */
                            <div className={styles.chooseWrapper}>
                                <div className={styles.chooseCard}>
                                    <p className={styles.chooseTitle}>How would you like to continue?</p>
                                    <p className={styles.chooseSubtitle}>
                                        Sign in to your account for a faster checkout, or continue as a guest.
                                    </p>
                                    <div className={styles.chooseButtons}>
                                        <button
                                            className={styles.confirmBtn}
                                            onClick={() => router.push("/login?next=/checkout")}
                                        >
                                            <BiLogIn style={{ marginRight: 8, fontSize: "13pt" }} />
                                            Sign In to Account
                                        </button>
                                        <button
                                            className={styles.chooseGuestBtn}
                                            onClick={() => setMode("guest-form")}
                                        >
                                            <BiUser style={{ marginRight: 8, fontSize: "13pt" }} />
                                            Continue as Guest
                                        </button>
                                        <Link href="/register" className={styles.chooseCreateLink}>
                                            Create an Account
                                        </Link>
                                    </div>
                                </div>
                            </div>

                        ) : mode === "guest-form" ? (
                            /* ── Guest info form ── */
                            <div className={styles.formGrid}>
                                <div className={styles.leftCol}>
                                    <GuestBanner />
                                    <SectionCard title="Your Information" icon={<BiUser />}>
                                        {guestStep === "email" ? (
                                            <GuestEmailStep onFound={handleGuestEmailFound} />
                                        ) : (
                                            <InfoForm
                                                initial={guestPrefill ?? emptyInfo()}
                                                onSubmit={handleGuestSubmit}
                                                loading={false}
                                                error={null}
                                                disabled={guestUserFound}
                                            />
                                        )}
                                    </SectionCard>
                                    <button
                                        className={styles.backLink}
                                        onClick={guestStep === "info" ? handleGuestBack : () => setMode("choose")}
                                    >
                                        ← Back
                                    </button>
                                </div>
                                <OrderSummary
                                    carData={carData} subtotals={subtotals}
                                    subtotal={subtotal} tax={tax} total={total}
                                    error={null} clientSecret={null} stripePromise={null}
                                    loading={false} onProceed={() => {}} onError={() => {}}
                                />
                            </div>

                        ) : (
                            /* ── Checkout: cart + payment ── */
                            <div className={styles.formGrid}>
                                <div className={styles.leftCol}>
                                    {guestInfo && <GuestBanner />}
                                    <SectionCard title="Your Vehicles" icon={<BiCar />}>
                                        <div>
                                            {carData.map((item) => (
                                                <CartItemRow
                                                    key={item.vin}
                                                    item={item}
                                                    onRemove={() => removeCar(item.vin)}
                                                />
                                            ))}
                                        </div>
                                    </SectionCard>

                                    {/* Authenticated user with incomplete profile: show editable form */}
                                    {isAuthenticated && !profileComplete && !guestInfo && (
                                        <SectionCard title="Your Information" icon={<BiUser />}>
                                            <InfoForm
                                                initial={profileInfo ?? emptyInfo()}
                                                onSubmit={(info) => setGuestInfo(info)}
                                                loading={loading}
                                                error={error}
                                            />
                                        </SectionCard>
                                    )}
                                </div>

                                <OrderSummary
                                    carData={carData} subtotals={subtotals}
                                    subtotal={subtotal} tax={tax} total={total}
                                    error={error} clientSecret={clientSecret} stripePromise={stripePromise}
                                    loading={loading}
                                    onProceed={handleProceed}
                                    onError={setError}
                                />
                            </div>
                        )}
                    </div>
                </MainBodyContainer>
            </div>
        </>
    );
}
