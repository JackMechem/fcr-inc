"use client";

import { useState } from "react";
import { useEffect } from "react";
import {
    getUser,
    updateAccount,
    updateUser,
    deleteAccount,
    deleteUser,
    Account,
    AccountRole,
    User,
} from "@/app/lib/AdminApiCalls";
import { useUserDashboardStore } from "@/stores/userDashboardStore";
import BulkActionsBar from "./BulkActionsBar";
import {
    BiSearch,
    BiRefresh,
    BiChevronDown,
    BiChevronUp,
    BiTrash,
    BiEdit,
    BiSave,
    BiX,
    BiUser,
} from "react-icons/bi";
import styles from "./inventoryPanel.module.css";
import userStyles from "./usersPanel.module.css";
import { LoadingSkeleton, EmptyState } from "./PanelLoading";

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

const fmtEpoch = (seconds: number) =>
    new Date(seconds * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const toEpoch = (dateStr: string): number => Math.floor(new Date(dateStr).getTime() / 1000);

const toDateInput = (seconds: number): string => {
    const d = new Date(seconds * 1000);
    return d.toISOString().split("T")[0];
};

const RoleBadge = ({ role }: { role: AccountRole }) => {
    const color =
        role === "ADMIN"
            ? { bg: "rgba(239,68,68,0.12)", color: "#ef4444" }
            : role === "STAFF"
            ? { bg: "rgba(59,130,246,0.12)", color: "#3b82f6" }
            : { bg: "var(--color-third)", color: "var(--color-foreground-light)" };
    return (
        <span
            style={{
                padding: "2px 10px",
                borderRadius: 9999,
                fontSize: "8pt",
                fontWeight: 600,
                backgroundColor: color.bg,
                color: color.color,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
            }}
        >
            {role}
        </span>
    );
};

// ── Edit Account Form ─────────────────────────────────────────────────────────

interface EditAccountFormProps {
    account: Account;
    canChangeRole: boolean;
    onSave: (patch: Partial<Pick<Account, "name" | "email" | "role">>) => Promise<void>;
    onCancel: () => void;
}

const EditAccountForm = ({ account, canChangeRole, onSave, onCancel }: EditAccountFormProps) => {
    const [name, setName] = useState(account.name);
    const [email, setEmail] = useState(account.email);
    const [role, setRole] = useState<AccountRole>(account.role);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const patch: Partial<Pick<Account, "name" | "email" | "role">> = {};
            if (name !== account.name) patch.name = name;
            if (email !== account.email) patch.email = email;
            if (role !== account.role) patch.role = role;
            await onSave(patch);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={userStyles.editForm}>
            <p className={styles.columnLabel}>Edit Account</p>
            <div className={userStyles.editGrid}>
                <div className={userStyles.fieldGroup}>
                    <label className={userStyles.fieldLabel}>Name</label>
                    <input
                        className={userStyles.fieldInput}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>
                <div className={userStyles.fieldGroup}>
                    <label className={userStyles.fieldLabel}>Email</label>
                    <input
                        className={userStyles.fieldInput}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                {canChangeRole && (
                    <div className={userStyles.fieldGroup}>
                        <label className={userStyles.fieldLabel}>Role</label>
                        <select
                            className={userStyles.fieldInput}
                            value={role}
                            onChange={(e) => setRole(e.target.value as AccountRole)}
                        >
                            <option value="CUSTOMER">CUSTOMER</option>
                            <option value="STAFF">STAFF</option>
                            <option value="ADMIN">ADMIN</option>
                        </select>
                    </div>
                )}
            </div>
            <div className={userStyles.formActions}>
                <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={handleSave} disabled={saving}>
                    {saving ? <BiRefresh className={styles.spinning} /> : <BiSave />}
                </button>
                <button className={`${styles.actionBtn}`} onClick={onCancel} style={{ opacity: 0.6 }}>
                    <BiX />
                </button>
            </div>
        </div>
    );
};

// ── Edit User Form ────────────────────────────────────────────────────────────

interface EditUserFormProps {
    user: User;
    onSave: (patch: Partial<Pick<User, "firstName" | "lastName" | "email" | "phoneNumber" | "address" | "driversLicense">>) => Promise<void>;
    onCancel: () => void;
}

const EditUserForm = ({ user, onSave, onCancel }: EditUserFormProps) => {
    const [firstName, setFirstName] = useState(user.firstName);
    const [lastName, setLastName] = useState(user.lastName);
    const [email, setEmail] = useState(user.email);
    const [phone, setPhone] = useState(user.phoneNumber);
    const [addr, setAddr] = useState(user.address);
    const [dl, setDl] = useState({
        driversLicense: user.driversLicense.driversLicense,
        state: user.driversLicense.state,
        expirationDate: toDateInput(user.driversLicense.expirationDate),
        dateOfBirth: toDateInput(user.driversLicense.dateOfBirth),
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const patch: Parameters<typeof onSave>[0] = {};
            if (firstName !== user.firstName) patch.firstName = firstName;
            if (lastName !== user.lastName) patch.lastName = lastName;
            if (email !== user.email) patch.email = email;
            if (phone !== user.phoneNumber) patch.phoneNumber = phone;

            const newAddr = { ...addr };
            if (JSON.stringify(newAddr) !== JSON.stringify(user.address)) patch.address = newAddr;

            const newDl = {
                driversLicense: dl.driversLicense,
                state: dl.state,
                expirationDate: toEpoch(dl.expirationDate),
                dateOfBirth: toEpoch(dl.dateOfBirth),
            };
            if (JSON.stringify(newDl) !== JSON.stringify(user.driversLicense)) patch.driversLicense = newDl;

            await onSave(patch);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={userStyles.editForm}>
            <p className={styles.columnLabel}>Edit User Info</p>
            <div className={userStyles.editGrid}>
                <div className={userStyles.fieldGroup}>
                    <label className={userStyles.fieldLabel}>First Name</label>
                    <input className={userStyles.fieldInput} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className={userStyles.fieldGroup}>
                    <label className={userStyles.fieldLabel}>Last Name</label>
                    <input className={userStyles.fieldInput} value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
                <div className={userStyles.fieldGroup}>
                    <label className={userStyles.fieldLabel}>Email</label>
                    <input className={userStyles.fieldInput} value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className={userStyles.fieldGroup}>
                    <label className={userStyles.fieldLabel}>Phone</label>
                    <input className={userStyles.fieldInput} value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
            </div>

            <p className={styles.columnLabel} style={{ marginTop: 12 }}>Address</p>
            <div className={userStyles.editGrid}>
                <div className={userStyles.fieldGroup}>
                    <label className={userStyles.fieldLabel}>Building #</label>
                    <input className={userStyles.fieldInput} value={addr.buildingNumber} onChange={(e) => setAddr({ ...addr, buildingNumber: e.target.value })} />
                </div>
                <div className={userStyles.fieldGroup}>
                    <label className={userStyles.fieldLabel}>Street</label>
                    <input className={userStyles.fieldInput} value={addr.streetName} onChange={(e) => setAddr({ ...addr, streetName: e.target.value })} />
                </div>
                <div className={userStyles.fieldGroup}>
                    <label className={userStyles.fieldLabel}>City</label>
                    <input className={userStyles.fieldInput} value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} />
                </div>
                <div className={userStyles.fieldGroup}>
                    <label className={userStyles.fieldLabel}>State</label>
                    <input className={userStyles.fieldInput} maxLength={2} value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value.toUpperCase() })} />
                </div>
                <div className={userStyles.fieldGroup}>
                    <label className={userStyles.fieldLabel}>Zip</label>
                    <input className={userStyles.fieldInput} value={addr.zipCode} onChange={(e) => setAddr({ ...addr, zipCode: e.target.value })} />
                </div>
            </div>

            <p className={styles.columnLabel} style={{ marginTop: 12 }}>Driver&apos;s License</p>
            <div className={userStyles.editGrid}>
                <div className={userStyles.fieldGroup}>
                    <label className={userStyles.fieldLabel}>License #</label>
                    <input className={userStyles.fieldInput} value={dl.driversLicense} onChange={(e) => setDl({ ...dl, driversLicense: e.target.value })} />
                </div>
                <div className={userStyles.fieldGroup}>
                    <label className={userStyles.fieldLabel}>Issuing State</label>
                    <input className={userStyles.fieldInput} maxLength={2} value={dl.state} onChange={(e) => setDl({ ...dl, state: e.target.value.toUpperCase() })} />
                </div>
                <div className={userStyles.fieldGroup}>
                    <label className={userStyles.fieldLabel}>Expiration Date</label>
                    <input type="date" className={userStyles.fieldInput} value={dl.expirationDate} onChange={(e) => setDl({ ...dl, expirationDate: e.target.value })} />
                </div>
                <div className={userStyles.fieldGroup}>
                    <label className={userStyles.fieldLabel}>Date of Birth</label>
                    <input type="date" className={userStyles.fieldInput} value={dl.dateOfBirth} onChange={(e) => setDl({ ...dl, dateOfBirth: e.target.value })} />
                </div>
            </div>

            <div className={userStyles.formActions}>
                <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={handleSave} disabled={saving}>
                    {saving ? <BiRefresh className={styles.spinning} /> : <BiSave />}
                </button>
                <button className={`${styles.actionBtn}`} onClick={onCancel} style={{ opacity: 0.6 }}>
                    <BiX />
                </button>
            </div>
        </div>
    );
};

// ── Expanded Row ──────────────────────────────────────────────────────────────

type EditTarget = "account" | "user" | null;

interface ExpandedRowProps {
    account: Account;
    user: User | null;
    userLoading: boolean;
    role: string;
    editTarget: EditTarget;
    setEditTarget: (t: EditTarget) => void;
    onAccountSave: (patch: Partial<Pick<Account, "name" | "email" | "role">>) => Promise<void>;
    onUserSave: (patch: Partial<Pick<User, "firstName" | "lastName" | "email" | "phoneNumber" | "address" | "driversLicense">>) => Promise<void>;
    onDeleteAccount: () => void;
    onDeleteUser: () => void;
}

const ExpandedRow = ({
    account,
    user,
    userLoading,
    role,
    editTarget,
    setEditTarget,
    onAccountSave,
    onUserSave,
    onDeleteAccount,
    onDeleteUser,
}: ExpandedRowProps) => {
    const canEdit = role === "STAFF" || role === "ADMIN";
    const canDelete = role === "ADMIN";

    return (
        <div className={styles.expandedSection} style={{ gap: 24 }}>
            {/* Account details */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <p className={styles.columnLabel}>Account</p>
                        <div style={{ display: "flex", gap: 6 }}>
                            {canEdit && editTarget !== "account" && (
                                <button
                                    className={`${styles.actionBtn} ${styles.editBtn}`}
                                    onClick={() => setEditTarget("account")}
                                    title="Edit account"
                                >
                                    <BiEdit />
                                </button>
                            )}
                            {canDelete && (
                                <button
                                    className={`${styles.actionBtn} ${userStyles.deleteBtn}`}
                                    onClick={onDeleteAccount}
                                    title="Delete account"
                                >
                                    <BiTrash />
                                </button>
                            )}
                        </div>
                    </div>

                    {editTarget === "account" ? (
                        <EditAccountForm
                            account={account}
                            canChangeRole={canEdit}
                            onSave={onAccountSave}
                            onCancel={() => setEditTarget(null)}
                        />
                    ) : (
                        <div className={styles.detailsGrid}>
                            {[
                                ["ID", String(account.acctId)],
                                ["Name", account.name],
                                ["Email", account.email],
                                ["Created", fmtDate(account.dateCreated)],
                                ["Email Confirmed", fmtDate(account.dateEmailConfirmed)],
                                ["Linked User ID", account.user != null ? String(account.user) : "—"],
                            ].map(([label, value]) => (
                                <div key={label}>
                                    <p className={styles.columnLabel}>{label}</p>
                                    <p className={styles.detailValue}>{value}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* User details */}
                <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <p className={styles.columnLabel}>User Profile</p>
                        {user && (
                            <div style={{ display: "flex", gap: 6 }}>
                                {canEdit && editTarget !== "user" && (
                                    <button
                                        className={`${styles.actionBtn} ${styles.editBtn}`}
                                        onClick={() => setEditTarget("user")}
                                        title="Edit user"
                                    >
                                        <BiEdit />
                                    </button>
                                )}
                                {canDelete && (
                                    <button
                                        className={`${styles.actionBtn} ${userStyles.deleteBtn}`}
                                        onClick={onDeleteUser}
                                        title="Delete user"
                                    >
                                        <BiTrash />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {userLoading ? (
                        <p className={styles.carYear}>Loading user…</p>
                    ) : !user ? (
                        <p className={styles.carYear}>No linked user profile.</p>
                    ) : editTarget === "user" ? (
                        <EditUserForm
                            user={user}
                            onSave={onUserSave}
                            onCancel={() => setEditTarget(null)}
                        />
                    ) : (
                        <div>
                            <div className={styles.detailsGrid}>
                                {[
                                    ["User ID", String(user.userId)],
                                    ["First Name", user.firstName],
                                    ["Last Name", user.lastName],
                                    ["Email", user.email],
                                    ["Phone", user.phoneNumber],
                                    ["Created", fmtDate(user.dateCreated)],
                                ].map(([label, value]) => (
                                    <div key={label}>
                                        <p className={styles.columnLabel}>{label}</p>
                                        <p className={styles.detailValue}>{value}</p>
                                    </div>
                                ))}
                            </div>

                            {user.address && (
                                <div style={{ marginTop: 12 }}>
                                    <p className={styles.columnLabel}>Address</p>
                                    <p className={styles.detailValue}>
                                        {user.address.buildingNumber} {user.address.streetName},{" "}
                                        {user.address.city}, {user.address.state} {user.address.zipCode}
                                    </p>
                                </div>
                            )}

                            {user.driversLicense && (
                                <div style={{ marginTop: 12 }}>
                                    <p className={styles.columnLabel}>Driver&apos;s License</p>
                                    <div className={styles.detailsGrid}>
                                        {[
                                            ["License #", user.driversLicense.driversLicense],
                                            ["State", user.driversLicense.state],
                                            ["Expires", fmtEpoch(user.driversLicense.expirationDate)],
                                            ["Date of Birth", fmtEpoch(user.driversLicense.dateOfBirth)],
                                        ].map(([label, value]) => (
                                            <div key={label}>
                                                <p className={styles.columnLabel}>{label}</p>
                                                <p className={styles.detailValue}>{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(user.reservations?.length > 0 || user.reviews?.length > 0) && (
                                <div style={{ marginTop: 12 }}>
                                    <div className={styles.detailsGrid}>
                                        <div>
                                            <p className={styles.columnLabel}>Reservations</p>
                                            <p className={styles.detailValue}>{user.reservations?.length ?? 0}</p>
                                        </div>
                                        <div>
                                            <p className={styles.columnLabel}>Reviews</p>
                                            <p className={styles.detailValue}>{user.reviews?.length ?? 0}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ── Account Row ───────────────────────────────────────────────────────────────

interface AccountRowProps {
    account: Account;
    isExpanded: boolean;
    onToggle: () => void;
    role: string;
    isSelected: boolean;
    onSelect: () => void;
}

const AccountRow = ({ account, isExpanded, onToggle, role, isSelected, onSelect }: AccountRowProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [userLoading, setUserLoading] = useState(false);
    const [userFetched, setUserFetched] = useState(false);
    const [localAccount, setLocalAccount] = useState(account);
    const [localUser, setLocalUser] = useState<User | null>(null);
    const [editTarget, setEditTarget] = useState<EditTarget>(null);
    const [deleted, setDeleted] = useState(false);

    const handleToggle = async () => {
        onToggle();
        if (!userFetched && account.user != null) {
            setUserLoading(true);
            try {
                const u = await getUser(account.user);
                setUser(u);
                setLocalUser(u);
            } catch {
                // no user
            } finally {
                setUserLoading(false);
                setUserFetched(true);
            }
        }
    };

    const handleAccountSave = async (patch: Partial<Pick<Account, "name" | "email" | "role">>) => {
        await updateAccount(localAccount.acctId, patch);
        setLocalAccount((prev) => ({ ...prev, ...patch }));
        setEditTarget(null);
    };

    const handleUserSave = async (patch: Partial<Pick<User, "firstName" | "lastName" | "email" | "phoneNumber" | "address" | "driversLicense">>) => {
        if (!localUser) return;
        await updateUser(localUser.userId, patch);
        setLocalUser((prev) => prev ? { ...prev, ...patch } : prev);
        setUser((prev) => prev ? { ...prev, ...patch } : prev);
        setEditTarget(null);
    };

    const handleDeleteAccount = async () => {
        const linkedUserId = localAccount.user;
        const msg = linkedUserId
            ? `Delete account #${localAccount.acctId}?\n\nThis account has a linked user profile (ID ${linkedUserId}). Also delete the user profile?`
            : `Delete account #${localAccount.acctId}? This cannot be undone.`;

        const confirmed = window.confirm(msg);
        if (!confirmed) return;

        await deleteAccount(localAccount.acctId);

        if (linkedUserId && window.confirm(`Delete linked user profile (ID ${linkedUserId})?`)) {
            try {
                await deleteUser(linkedUserId);
            } catch {
                // user may already be gone
            }
        }

        setDeleted(true);
    };

    const handleDeleteUser = async () => {
        if (!localUser) return;
        if (!window.confirm(`Delete user profile #${localUser.userId}? The account will remain.`)) return;
        await deleteUser(localUser.userId);
        setLocalUser(null);
        setUser(null);
    };

    if (deleted) return null;

    return (
        <div>
            <div
                className={styles.summaryRow}
                style={{ gridTemplateColumns: "28px 2fr 0.7fr 1fr 1fr auto" }}
                onClick={handleToggle}
            >
                <div className={styles.cbCell} onClick={(e) => e.stopPropagation()}>
                    <input
                        type="checkbox"
                        className={styles.cb}
                        checked={isSelected}
                        onChange={onSelect}
                    />
                </div>
                {/* Identity */}
                <div className={styles.vehicleCell}>
                    <div
                        className={styles.thumbnail}
                        style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0 }}
                    >
                        <div className={styles.placeholderIconWrapper}>
                            <BiUser style={{ fontSize: "16pt" }} />
                        </div>
                    </div>
                    <div className={styles.minWidthZero}>
                        <p className={styles.carTitle}>{localAccount.name}</p>
                        <p className={styles.carYear}>{localAccount.email}</p>
                    </div>
                </div>

                {/* Account ID */}
                <p className={`${styles.carYear} ${styles.vinText}`} style={{ fontFamily: "monospace" }}>
                    #{localAccount.acctId}
                </p>

                {/* Role */}
                <div className={styles.hideMobile}>
                    <RoleBadge role={localAccount.role} />
                </div>

                {/* Created */}
                <p className={`${styles.carYear} ${styles.hideMobile}`} style={{ fontSize: "10pt", color: "var(--color-foreground)" }}>
                    {fmtDate(localAccount.dateCreated)}
                </p>

                {/* Chevron */}
                <div className={styles.actionGroup} onClick={(e) => e.stopPropagation()}>
                    <span className={styles.chevronIcon}>
                        {isExpanded ? <BiChevronUp /> : <BiChevronDown />}
                    </span>
                </div>
            </div>

            {isExpanded && (
                <ExpandedRow
                    account={localAccount}
                    user={localUser ?? user}
                    userLoading={userLoading}
                    role={role}
                    editTarget={editTarget}
                    setEditTarget={setEditTarget}
                    onAccountSave={handleAccountSave}
                    onUserSave={handleUserSave}
                    onDeleteAccount={handleDeleteAccount}
                    onDeleteUser={handleDeleteUser}
                />
            )}
        </div>
    );
};

// ── Main Panel ────────────────────────────────────────────────────────────────

interface UsersPanelProps {
    accounts: Account[];
    onRefresh: () => Promise<void>;
}

const UsersPanel = ({ accounts: initialAccounts, onRefresh }: UsersPanelProps) => {
    const { role } = useUserDashboardStore();
    const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState("");
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [bulkDeleting, setBulkDeleting] = useState(false);

    useEffect(() => { setAccounts(initialAccounts); }, [initialAccounts]);

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            await onRefresh();
        } catch (e) {
            alert("Fetch failed: " + e);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelect = (id: number) =>
        setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

    const handleBulkDelete = async () => {
        if (!window.confirm(`Delete ${selected.size} account${selected.size !== 1 ? "s" : ""}? This cannot be undone.`)) return;
        setBulkDeleting(true);
        const ids = [...selected];
        const results = await Promise.allSettled(ids.map((id) => deleteAccount(id)));
        const deleted = ids.filter((_, i) => results[i].status === "fulfilled");
        const failed = ids.filter((_, i) => results[i].status === "rejected");
        setAccounts((prev) => prev.filter((a) => !deleted.includes(a.acctId)));
        setSelected(new Set(failed));
        setBulkDeleting(false);
        if (failed.length) alert(`${failed.length} deletion(s) failed.`);
    };

    const filtered = accounts.filter((a) =>
        `${a.name} ${a.email} ${a.acctId} ${a.role}`.toLowerCase().includes(query.toLowerCase()),
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h2 className="page-title">Users &amp; Accounts</h2>
                    <p className="page-subtitle">
                        {filtered.length} of {accounts.length} accounts
                    </p>
                </div>
                <button
                    onClick={fetchAccounts}
                    disabled={loading}
                    className={`${styles.btn} ${styles.btnRefresh}`}
                >
                    <BiRefresh className={loading ? styles.spinning : ""} />
                    Refresh
                </button>
            </div>

            <div className={styles.searchWrapper}>
                <BiSearch className={styles.searchIcon} />
                <input
                    className={styles.searchInput}
                    placeholder="Search by name, email, ID or role…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

            {selected.size > 0 && (
                <BulkActionsBar
                    count={selected.size}
                    deleting={bulkDeleting}
                    onDelete={handleBulkDelete}
                    onClear={() => setSelected(new Set())}
                />
            )}

            <div className={styles.tableContainer}>
                <div className={styles.tableHeader} style={{ gridTemplateColumns: "28px 2fr 0.7fr 1fr 1fr auto" }}>
                    <div className={styles.cbCell}>
                        <input
                            type="checkbox"
                            className={styles.cb}
                            checked={filtered.length > 0 && filtered.every((a) => selected.has(a.acctId))}
                            onChange={(e) => setSelected(e.target.checked ? new Set(filtered.map((a) => a.acctId)) : new Set())}
                        />
                    </div>
                    {["Account", "ID", "Role", "Created", ""].map((h) => (
                        <p key={h} className={styles.columnLabel}>{h}</p>
                    ))}
                </div>

                <div className={styles.rowList}>
                    {loading ? (
                        <LoadingSkeleton label="Fetching accounts…" />
                    ) : filtered.length === 0 ? (
                        <EmptyState icon={<BiUser />} message="No accounts match your search." />
                    ) : (
                        filtered.map((account) => (
                            <AccountRow
                                key={account.acctId}
                                account={account}
                                isExpanded={expandedId === account.acctId}
                                onToggle={() =>
                                    setExpandedId(expandedId === account.acctId ? null : account.acctId)
                                }
                                role={role ?? ""}
                                isSelected={selected.has(account.acctId)}
                                onSelect={() => toggleSelect(account.acctId)}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default UsersPanel;
