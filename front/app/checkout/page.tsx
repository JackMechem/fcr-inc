"use client";

import { useState } from "react";
import Image from "next/image";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import NavHeader from "../components/headers/navHeader";
import MainBodyContainer from "../components/containers/mainBodyContainer";
import { useCartStore } from "@/stores/cartStore";
import { CartProps } from "../types/CartTypes";
import { BiCar, BiCalendar, BiTrash, BiIdCard, BiUser, BiMap, BiPhone, BiEnvelope } from "react-icons/bi";
import styles from "./checkout.module.css";

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

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>{label}</label>
        {children}
    </div>
);

// ── Stripe payment form (must be inside <Elements>) ───────────────────────────

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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
    const { carData, removeCar } = useCartStore();

    const [form, setForm] = useState({
        firstName: "", lastName: "", email: "", phoneNumber: "",
        buildingNumber: "", streetName: "", city: "", state: "", zipCode: "",
        licenseNumber: "", licenseState: "", expirationDate: "", dateOfBirth: "",
    });
    const [emailChecked, setEmailChecked] = useState(false);
    const [emailChecking, setEmailChecking] = useState(false);
    const [userExists, setUserExists] = useState(false);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((prev) => ({ ...prev, [key]: e.target.value }));

    const handleEmailCheck = async (e: React.FormEvent) => {
        e.preventDefault();
        setEmailChecking(true);
        try {
            const res = await fetch(`/api/user-lookup?email=${encodeURIComponent(form.email)}`);
            const userRes = res.ok ? await res.json() : null;
            const user = userRes?.data?.[0] ?? userRes ?? null;
            console.log(user);
            if (user) {
                setUserExists(true);
                setForm((prev) => ({
                    ...prev,
                    firstName: user.firstName ?? "",
                    lastName: user.lastName ?? "",
                    phoneNumber: user.phoneNumber ?? "",
                    buildingNumber: user.address?.buildingNumber ?? "",
                    streetName: user.address?.streetName ?? "",
                    city: user.address?.city ?? "",
                    state: user.address?.state ?? "",
                    zipCode: user.address?.zipCode ?? "",
                    licenseNumber: user.driversLicense?.driversLicense ?? "",
                    licenseState: user.driversLicense?.state ?? "",
                    expirationDate: user.driversLicense?.expirationDate
                        ? new Date(user.driversLicense.expirationDate * 1000).toISOString().split("T")[0]
                        : "",
                    dateOfBirth: user.driversLicense?.dateOfBirth
                        ? new Date(user.driversLicense.dateOfBirth * 1000).toISOString().split("T")[0]
                        : "",
                }));
            } else {
                setUserExists(false);
            }
            setEmailChecked(true);
        } finally {
            setEmailChecking(false);
        }
    };

    const resetEmail = () => {
        setEmailChecked(false);
        setUserExists(false);
        setForm((prev) => ({ ...prev, email: "" }));
    };

    const subtotals = carData.map((item) => item.pricePerDay * daysBetween(item.startDate, item.endDate));
    const subtotal = subtotals.reduce((a, b) => a + b, 0);
    const tax = Math.round(subtotal * 0.08);
    const total = subtotal + tax;

    const handleProceed = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/payment-intent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userInfo: {
                        email: form.email,
                        firstName: form.firstName,
                        lastName: form.lastName,
                        phoneNumber: form.phoneNumber,
                        address: {
                            buildingNumber: form.buildingNumber,
                            streetName: form.streetName,
                            city: form.city,
                            state: form.state,
                            zipCode: form.zipCode,
                        },
                        driversLicense: {
                            driversLicense: form.licenseNumber,
                            state: form.licenseState,
                            expirationDate: toUnixSeconds(form.expirationDate),
                            dateOfBirth: toUnixSeconds(form.dateOfBirth),
                        },
                    },
                    cars: carData.map((item) => ({
                        vin: item.vin,
                        pickUpTime: item.startDate ? new Date(item.startDate).toISOString() : "",
                        dropOffTime: item.endDate ? new Date(item.endDate).toISOString() : "",
                    })),
                }),
            });

            if (!res.ok) throw new Error((await res.json()).error ?? "Failed to initiate payment.");

            const data = await res.json();
            setStripePromise(loadStripe(data.publishableKey));
            setClientSecret(data.clientSecret);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
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
                        ) : (
                            <div className={styles.formGrid}>

                                {/* ── Left column ── */}
                                <div className={styles.leftCol}>
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

                                    {!clientSecret && (<>
                                        <SectionCard title="Personal Info" icon={<BiUser />}>
                                            {/* Email row — always shown */}
                                            <Field label="Email">
                                                <div className={styles.emailRow}>
                                                    <div className={styles.inputWithIcon}>
                                                        <BiEnvelope className={styles.inputIcon} />
                                                        <input
                                                            type="email"
                                                            className={`${styles.inputWithIconField} ${emailChecked ? styles.inputReadonly : ""}`}
                                                            placeholder="john@example.com"
                                                            value={form.email}
                                                            onChange={set("email")}
                                                            readOnly={emailChecked}
                                                            required
                                                        />
                                                    </div>
                                                    {emailChecked ? (
                                                        <button type="button" className={styles.changeEmailBtn} onClick={resetEmail}>
                                                            Change
                                                        </button>
                                                    ) : (
                                                        <form onSubmit={handleEmailCheck}>
                                                            <button type="submit" className={styles.checkEmailBtn} disabled={emailChecking}>
                                                                {emailChecking ? "..." : "Continue"}
                                                            </button>
                                                        </form>
                                                    )}
                                                </div>
                                            </Field>

                                            {/* Rest of personal info — shown after email check */}
                                            {emailChecked && (<>
                                                {userExists && (
                                                    <p className={styles.userFoundNote}>Account found — details pre-filled.</p>
                                                )}
                                                <div className={styles.inputGrid2}>
                                                    <Field label="First Name">
                                                        <input
                                                            className={`${styles.input} ${userExists ? styles.inputReadonly : ""}`}
                                                            placeholder="John" value={form.firstName}
                                                            onChange={set("firstName")} readOnly={userExists} required />
                                                    </Field>
                                                    <Field label="Last Name">
                                                        <input
                                                            className={`${styles.input} ${userExists ? styles.inputReadonly : ""}`}
                                                            placeholder="Doe" value={form.lastName}
                                                            onChange={set("lastName")} readOnly={userExists} required />
                                                    </Field>
                                                </div>
                                                <Field label="Phone">
                                                    <div className={styles.inputWithIcon}>
                                                        <BiPhone className={styles.inputIcon} />
                                                        <input type="tel"
                                                            className={`${styles.inputWithIconField} ${userExists ? styles.inputReadonly : ""}`}
                                                            placeholder="555-555-5555" value={form.phoneNumber}
                                                            onChange={set("phoneNumber")} readOnly={userExists} required />
                                                    </div>
                                                </Field>
                                            </>)}
                                        </SectionCard>

                                        {emailChecked && (<>
                                            <SectionCard title="Address" icon={<BiMap />}>
                                                <div className={styles.inputGrid2}>
                                                    <Field label="Building Number">
                                                        <input className={`${styles.input} ${userExists ? styles.inputReadonly : ""}`}
                                                            placeholder="123" value={form.buildingNumber}
                                                            onChange={set("buildingNumber")} readOnly={userExists} required />
                                                    </Field>
                                                    <Field label="Street Name">
                                                        <input className={`${styles.input} ${userExists ? styles.inputReadonly : ""}`}
                                                            placeholder="Main St" value={form.streetName}
                                                            onChange={set("streetName")} readOnly={userExists} required />
                                                    </Field>
                                                </div>
                                                <div className={styles.inputGrid2}>
                                                    <Field label="City">
                                                        <input className={`${styles.input} ${userExists ? styles.inputReadonly : ""}`}
                                                            placeholder="Springfield" value={form.city}
                                                            onChange={set("city")} readOnly={userExists} required />
                                                    </Field>
                                                    <Field label="State">
                                                        <input className={`${styles.input} ${userExists ? styles.inputReadonly : ""}`}
                                                            placeholder="IL" value={form.state} maxLength={2}
                                                            onChange={set("state")} readOnly={userExists} required />
                                                    </Field>
                                                </div>
                                                <Field label="Zip Code">
                                                    <input className={`${styles.input} ${userExists ? styles.inputReadonly : ""}`}
                                                        placeholder="62701" value={form.zipCode}
                                                        onChange={set("zipCode")} readOnly={userExists} required />
                                                </Field>
                                            </SectionCard>

                                            <SectionCard title="Driver's License" icon={<BiIdCard />}>
                                                <div className={styles.inputGrid2}>
                                                    <Field label="License Number">
                                                        <div className={styles.inputWithIcon}>
                                                            <BiIdCard className={styles.inputIcon} />
                                                            <input className={`${styles.inputWithIconField} ${userExists ? styles.inputReadonly : ""}`}
                                                                placeholder="D1234567" value={form.licenseNumber}
                                                                onChange={set("licenseNumber")} readOnly={userExists} required />
                                                        </div>
                                                    </Field>
                                                    <Field label="State">
                                                        <input className={`${styles.input} ${userExists ? styles.inputReadonly : ""}`}
                                                            placeholder="IL" value={form.licenseState} maxLength={2}
                                                            onChange={set("licenseState")} readOnly={userExists} required />
                                                    </Field>
                                                </div>
                                                <div className={styles.inputGrid2}>
                                                    <Field label="Expiration Date">
                                                        <input type="date" className={`${styles.input} ${userExists ? styles.inputReadonly : ""}`}
                                                            value={form.expirationDate}
                                                            onChange={set("expirationDate")} readOnly={userExists} required />
                                                    </Field>
                                                    <Field label="Date of Birth">
                                                        <input type="date" className={`${styles.input} ${userExists ? styles.inputReadonly : ""}`}
                                                            value={form.dateOfBirth}
                                                            onChange={set("dateOfBirth")} readOnly={userExists} required />
                                                    </Field>
                                                </div>
                                            </SectionCard>
                                        </>)}
                                    </>)}
                                </div>

                                {/* ── Right column: Order summary ── */}
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
                                            <StripePaymentForm onError={setError} />
                                        </Elements>
                                    ) : (
                                        <form onSubmit={handleProceed}>
                                            <button
                                                type="submit"
                                                className={styles.confirmBtn}
                                                disabled={loading}
                                            >
                                                {loading ? "Loading..." : "Proceed to Payment"}
                                            </button>
                                        </form>
                                    )}

                                    <p className={styles.termsNote}>
                                        By confirming, you agree to our terms of service and rental policy.
                                    </p>
                                </div>

                            </div>
                        )}
                    </div>
                </MainBodyContainer>
            </div>
        </>
    );
}
