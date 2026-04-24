"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import NavHeader from "../components/headers/navHeader";
import { browserApi } from "@/app/lib/fcr-client";
import styles from "./register.module.css";

const toUnixSeconds = (dateStr: string) =>
    dateStr ? Math.floor(new Date(dateStr).getTime() / 1000) : 0;

function RegisterForm() {
    const searchParams = useSearchParams();

    const [form, setForm] = useState({
        email: searchParams.get("email") ?? "",
        firstName: "",
        lastName: "",
        phoneNumber: "",
        buildingNumber: "",
        streetName: "",
        city: "",
        state: "",
        zipCode: "",
        licenseNumber: "",
        licenseState: "",
        expirationDate: "",
        dateOfBirth: "",
    });
    const [done, setDone] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((prev) => ({ ...prev, [key]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await browserApi.auth.register({
                email: form.email,
                role: "CUSTOMER",
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
            });

            if (res.status === 201) {
                setDone(true);
                return;
            }

            if (res.status === 409) {
                setError("An account already exists for this email. Sign in instead.");
                return;
            }

            setError("Something went wrong. Please try again.");
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (done) {
        return (
            <>
                <NavHeader white={false} />
                <div className={styles.pageWrapper}>
                    <div className={styles.card}>
                        <h1 className={`page-title ${styles.title}`}>Check Your Email</h1>
                        <p className={styles.subtitle}>
                            We sent a confirmation link to <strong>{form.email}</strong>. Click it to activate your account.
                        </p>
                        <div className={styles.actions}>
                            <Link href="/login" className={styles.submitBtn}>Back to Sign In</Link>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <NavHeader white={false} />
            <div className={styles.pageWrapper}>
                <div className={styles.card}>
                    <h1 className={`page-title ${styles.title}`}>Create Account</h1>
                    <p className={styles.subtitle}>Fill in your details to create a full account.</p>

                    <form onSubmit={handleSubmit}>

                        {/* ── Account ── */}
                        <div className={styles.section}>
                            <p className={styles.sectionTitle}>Account</p>
                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>Email</label>
                                <input type="email" className={styles.input} placeholder="john@example.com"
                                    value={form.email} onChange={set("email")} required autoFocus />
                            </div>
                        </div>

                        {/* ── Personal Info ── */}
                        <div className={styles.section}>
                            <p className={styles.sectionTitle}>Personal Info</p>
                            <div className={styles.grid2}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>First Name</label>
                                    <input className={styles.input} placeholder="John"
                                        value={form.firstName} onChange={set("firstName")} required />
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>Last Name</label>
                                    <input className={styles.input} placeholder="Doe"
                                        value={form.lastName} onChange={set("lastName")} required />
                                </div>
                            </div>
                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>Phone</label>
                                <input type="tel" className={styles.input} placeholder="555-555-5555"
                                    value={form.phoneNumber} onChange={set("phoneNumber")} required />
                            </div>
                        </div>

                        {/* ── Address ── */}
                        <div className={styles.section}>
                            <p className={styles.sectionTitle}>Address</p>
                            <div className={styles.grid2}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>Building Number</label>
                                    <input className={styles.input} placeholder="123"
                                        value={form.buildingNumber} onChange={set("buildingNumber")} required />
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>Street Name</label>
                                    <input className={styles.input} placeholder="Main St"
                                        value={form.streetName} onChange={set("streetName")} required />
                                </div>
                            </div>
                            <div className={styles.grid2}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>City</label>
                                    <input className={styles.input} placeholder="Springfield"
                                        value={form.city} onChange={set("city")} required />
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>State</label>
                                    <input className={styles.input} placeholder="IL" maxLength={2}
                                        value={form.state} onChange={set("state")} required />
                                </div>
                            </div>
                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>Zip Code</label>
                                <input className={styles.input} placeholder="62701"
                                    value={form.zipCode} onChange={set("zipCode")} required />
                            </div>
                        </div>

                        {/* ── Driver's License ── */}
                        <div className={styles.section}>
                            <p className={styles.sectionTitle}>Driver&apos;s License</p>
                            <div className={styles.grid2}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>License Number</label>
                                    <input className={styles.input} placeholder="D1234567"
                                        value={form.licenseNumber} onChange={set("licenseNumber")} required />
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>State</label>
                                    <input className={styles.input} placeholder="IL" maxLength={2}
                                        value={form.licenseState} onChange={set("licenseState")} required />
                                </div>
                            </div>
                            <div className={styles.grid2}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>Expiration Date</label>
                                    <input type="date" className={styles.input}
                                        value={form.expirationDate} onChange={set("expirationDate")} required />
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>Date of Birth</label>
                                    <input type="date" className={styles.input}
                                        value={form.dateOfBirth} onChange={set("dateOfBirth")} required />
                                </div>
                            </div>
                        </div>

                        {error && <p className={styles.errorText}>{error}</p>}

                        <div className={styles.actions}>
                            <button type="submit" className={styles.submitBtn} disabled={loading}>
                                {loading ? "Creating account..." : "Create Account"}
                            </button>
                            <Link href="/login" className={styles.secondaryBtn}>
                                Already have an account? Sign in
                            </Link>
                        </div>

                    </form>
                </div>
            </div>
        </>
    );
}

export default function RegisterPage() {
    return (
        <Suspense>
            <RegisterForm />
        </Suspense>
    );
}
