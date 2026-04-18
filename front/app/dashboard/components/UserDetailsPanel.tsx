"use client";

import { useState } from "react";
import { useUserDashboardStore } from "@/stores/userDashboardStore";
import { BiUser, BiPhone, BiMap, BiIdCard, BiEnvelope } from "react-icons/bi";
import styles from "./panels.module.css";

interface UserForm {
    firstName: string; lastName: string; phoneNumber: string;
    buildingNumber: string; streetName: string; city: string; state: string; zipCode: string;
    licenseNumber: string; licenseState: string; expirationDate: string; dateOfBirth: string;
}

const toDateStr = (ts?: number) =>
    ts ? new Date(ts * 1000).toISOString().split("T")[0] : "";

const toUnix = (s: string) => s ? Math.floor(new Date(s).getTime() / 1000) : 0;

const defaultForm: UserForm = {
    firstName: "", lastName: "", phoneNumber: "",
    buildingNumber: "", streetName: "", city: "", state: "", zipCode: "",
    licenseNumber: "", licenseState: "", expirationDate: "", dateOfBirth: "",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapUserToForm(user: Record<string, any>): UserForm {
    const addr = user.address ?? {};
    const lic = user.driversLicense ?? {};
    return {
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        phoneNumber: user.phoneNumber ?? "",
        buildingNumber: addr.buildingNumber ?? "",
        streetName: addr.streetName ?? "",
        city: addr.city ?? "",
        state: addr.state ?? "",
        zipCode: addr.zipCode ?? "",
        licenseNumber: lic.driversLicense ?? "",
        licenseState: lic.state ?? "",
        expirationDate: toDateStr(lic.expirationDate),
        dateOfBirth: toDateStr(lic.dateOfBirth),
    };
}

interface Props {
    initialUser?: Record<string, unknown> | null;
}

export default function UserDetailsPanel({ initialUser }: Props) {
    const { stripeUserId } = useUserDashboardStore();
    const [form, setForm] = useState<UserForm>(initialUser ? mapUserToForm(initialUser) : defaultForm);
    const [email, setEmail] = useState(initialUser ? String(initialUser.email ?? "") : "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const set = (key: keyof UserForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((prev) => ({ ...prev, [key]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            const res = await fetch(`/api/users/${stripeUserId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
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
                        expirationDate: toUnix(form.expirationDate),
                        dateOfBirth: toUnix(form.dateOfBirth),
                    },
                }),
            });

            if (res.status >= 400) throw new Error((await res.json()).error ?? "Failed to update user.");
            setSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className="page-title">My Profile</h1>
                <p className="page-subtitle">View and update your personal information</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
                {/* Email (read-only identifier) */}
                <div className={styles.formSection}>
                    <p className={styles.sectionTitle}><BiEnvelope className={styles.sectionIcon} /> Account</p>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Email</label>
                        <input className={`${styles.input} ${styles.inputReadonly}`} value={email} readOnly />
                    </div>
                </div>

                {/* Personal info */}
                <div className={styles.formSection}>
                    <p className={styles.sectionTitle}><BiUser className={styles.sectionIcon} /> Personal Info</p>
                    <div className={styles.grid2}>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>First Name</label>
                            <input className={styles.input} value={form.firstName} onChange={set("firstName")} required />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Last Name</label>
                            <input className={styles.input} value={form.lastName} onChange={set("lastName")} required />
                        </div>
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}><BiPhone style={{ marginRight: 4 }} />Phone</label>
                        <input className={styles.input} value={form.phoneNumber} onChange={set("phoneNumber")} required />
                    </div>
                </div>

                {/* Address */}
                <div className={styles.formSection}>
                    <p className={styles.sectionTitle}><BiMap className={styles.sectionIcon} /> Address</p>
                    <div className={styles.grid2}>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Building Number</label>
                            <input className={styles.input} value={form.buildingNumber} onChange={set("buildingNumber")} required />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Street Name</label>
                            <input className={styles.input} value={form.streetName} onChange={set("streetName")} required />
                        </div>
                    </div>
                    <div className={styles.grid3}>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>City</label>
                            <input className={styles.input} value={form.city} onChange={set("city")} required />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>State</label>
                            <input className={styles.input} value={form.state} onChange={set("state")} maxLength={2} required />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Zip Code</label>
                            <input className={styles.input} value={form.zipCode} onChange={set("zipCode")} required />
                        </div>
                    </div>
                </div>

                {/* Driver's License */}
                <div className={styles.formSection}>
                    <p className={styles.sectionTitle}><BiIdCard className={styles.sectionIcon} /> Driver&apos;s License</p>
                    <div className={styles.grid2}>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>License Number</label>
                            <input className={styles.input} value={form.licenseNumber} onChange={set("licenseNumber")} required />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>State</label>
                            <input className={styles.input} value={form.licenseState} onChange={set("licenseState")} maxLength={2} required />
                        </div>
                    </div>
                    <div className={styles.grid2}>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Expiration Date</label>
                            <input type="date" className={styles.input} value={form.expirationDate} onChange={set("expirationDate")} required />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Date of Birth</label>
                            <input type="date" className={styles.input} value={form.dateOfBirth} onChange={set("dateOfBirth")} required />
                        </div>
                    </div>
                </div>

                {error && <p className={styles.error}>{error}</p>}
                {success && <p className={styles.successText}>Details updated successfully.</p>}

                <button type="submit" className={styles.primaryBtn} disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                </button>
            </form>
        </div>
    );
}
