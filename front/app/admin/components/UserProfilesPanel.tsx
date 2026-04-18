"use client";

import { useState, useEffect } from "react";
import { User, updateUser, deleteUser } from "@/app/lib/AdminApiCalls";
import BulkActionsBar from "./BulkActionsBar";
import { useUserDashboardStore } from "@/stores/userDashboardStore";
import {
    BiSearch,
    BiRefresh,
    BiChevronDown,
    BiChevronUp,
    BiUser,
    BiEdit,
    BiTrash,
    BiSave,
    BiX,
} from "react-icons/bi";
import styles from "./inventoryPanel.module.css";
import userStyles from "./usersPanel.module.css";
import { LoadingSkeleton, EmptyState } from "./PanelLoading";

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

const fmtEpoch = (seconds: number) =>
    new Date(seconds * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const toDateInput = (seconds: number): string =>
    new Date(seconds * 1000).toISOString().split("T")[0];

const toEpoch = (dateStr: string): number =>
    Math.floor(new Date(dateStr).getTime() / 1000);

// ── Edit Form ─────────────────────────────────────────────────────────────────

interface EditFormProps {
    user: User;
    onSave: (patch: Partial<Pick<User, "firstName" | "lastName" | "email" | "phoneNumber" | "address" | "driversLicense">>) => Promise<void>;
    onCancel: () => void;
}

const EditForm = ({ user, onSave, onCancel }: EditFormProps) => {
    const [firstName, setFirstName] = useState(user.firstName);
    const [lastName,  setLastName]  = useState(user.lastName);
    const [email,     setEmail]     = useState(user.email);
    const [phone,     setPhone]     = useState(user.phoneNumber);
    const [addr,      setAddr]      = useState(user.address ?? { buildingNumber: "", streetName: "", city: "", state: "", zipCode: "" });
    const [dl, setDl] = useState({
        driversLicense: user.driversLicense?.driversLicense ?? "",
        state:          user.driversLicense?.state ?? "",
        expirationDate: user.driversLicense ? toDateInput(user.driversLicense.expirationDate) : "",
        dateOfBirth:    user.driversLicense ? toDateInput(user.driversLicense.dateOfBirth)    : "",
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const patch: Parameters<typeof onSave>[0] = {};
            if (firstName !== user.firstName)   patch.firstName   = firstName;
            if (lastName  !== user.lastName)    patch.lastName    = lastName;
            if (email     !== user.email)       patch.email       = email;
            if (phone     !== user.phoneNumber) patch.phoneNumber = phone;

            const newAddr = { ...addr };
            if (JSON.stringify(newAddr) !== JSON.stringify(user.address))
                patch.address = newAddr;

            const newDl = {
                driversLicense: dl.driversLicense,
                state:          dl.state,
                expirationDate: toEpoch(dl.expirationDate),
                dateOfBirth:    toEpoch(dl.dateOfBirth),
            };
            if (JSON.stringify(newDl) !== JSON.stringify(user.driversLicense))
                patch.driversLicense = newDl;

            await onSave(patch);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={userStyles.editForm}>
            <p className={styles.columnLabel}>Edit User</p>
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
                <button className={styles.actionBtn} onClick={onCancel} style={{ opacity: 0.6 }}>
                    <BiX />
                </button>
            </div>
        </div>
    );
};

// ── Expanded Row ──────────────────────────────────────────────────────────────

interface ExpandedRowProps {
    user: User;
    editing: boolean;
    canEdit: boolean;
    canDelete: boolean;
    onEditClick: () => void;
    onSave: (patch: Partial<Pick<User, "firstName" | "lastName" | "email" | "phoneNumber" | "address" | "driversLicense">>) => Promise<void>;
    onCancelEdit: () => void;
    onDelete: () => void;
}

const ExpandedRow = ({ user, editing, canEdit, canDelete, onEditClick, onSave, onCancelEdit, onDelete }: ExpandedRowProps) => (
    <div className={styles.expandedSection}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <p className={styles.columnLabel}>User Profile</p>
                    <div style={{ display: "flex", gap: 6 }}>
                        {canEdit && !editing && (
                            <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={onEditClick} title="Edit user">
                                <BiEdit />
                            </button>
                        )}
                        {canDelete && (
                            <button className={`${styles.actionBtn} ${userStyles.deleteBtn}`} onClick={onDelete} title="Delete user">
                                <BiTrash />
                            </button>
                        )}
                    </div>
                </div>

                {editing ? (
                    <EditForm user={user} onSave={onSave} onCancel={onCancelEdit} />
                ) : (
                    <>
                        <div className={styles.detailsGrid}>
                            {[
                                ["User ID",       String(user.userId)],
                                ["Email",         user.email],
                                ["Phone",         user.phoneNumber || "—"],
                                ["Created",       fmtDate(user.dateCreated)],
                                ["Reservations",  String(user.reservations?.length ?? 0)],
                                ["Reviews",       String(user.reviews?.length ?? 0)],
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
                                        ["State",     user.driversLicense.state],
                                        ["Expires",   fmtEpoch(user.driversLicense.expirationDate)],
                                        ["DOB",       fmtEpoch(user.driversLicense.dateOfBirth)],
                                    ].map(([label, value]) => (
                                        <div key={label}>
                                            <p className={styles.columnLabel}>{label}</p>
                                            <p className={styles.detailValue}>{value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    </div>
);

// ── User Row ──────────────────────────────────────────────────────────────────

interface UserRowProps {
    user: User;
    isExpanded: boolean;
    onToggle: () => void;
    canEdit: boolean;
    canDelete: boolean;
    isSelected: boolean;
    onSelect: () => void;
}

const UserRow = ({ user, isExpanded, onToggle, canEdit, canDelete, isSelected, onSelect }: UserRowProps) => {
    const [localUser, setLocalUser] = useState(user);
    const [editing,   setEditing]   = useState(false);
    const [deleted,   setDeleted]   = useState(false);

    const handleSave = async (patch: Parameters<typeof updateUser>[1]) => {
        await updateUser(localUser.userId, patch);
        setLocalUser((prev) => ({ ...prev, ...patch }));
        setEditing(false);
    };

    const handleDelete = async () => {
        if (!window.confirm(`Delete user #${localUser.userId} (${localUser.firstName} ${localUser.lastName})? This cannot be undone.`)) return;
        await deleteUser(localUser.userId);
        setDeleted(true);
    };

    if (deleted) return null;

    return (
        <div>
            <div
                className={styles.summaryRow}
                style={{ gridTemplateColumns: "28px 2fr 1fr 1fr 1fr auto" }}
                onClick={onToggle}
            >
                <div className={styles.cbCell} onClick={(e) => e.stopPropagation()}>
                    <input
                        type="checkbox"
                        className={styles.cb}
                        checked={isSelected}
                        onChange={onSelect}
                    />
                </div>
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
                        <p className={styles.carTitle}>{localUser.firstName} {localUser.lastName}</p>
                        <p className={styles.carYear}>{localUser.email}</p>
                    </div>
                </div>

                <p className={`${styles.carYear} ${styles.vinText}`} style={{ fontFamily: "monospace" }}>
                    #{localUser.userId}
                </p>

                <p className={`${styles.carYear} ${styles.hideMobile}`} style={{ fontSize: "10pt", color: "var(--color-foreground)" }}>
                    {localUser.phoneNumber || "—"}
                </p>

                <p className={`${styles.carYear} ${styles.hideMobile}`} style={{ fontSize: "10pt", color: "var(--color-foreground)" }}>
                    {fmtDate(localUser.dateCreated)}
                </p>

                <div className={styles.actionGroup}>
                    <span className={styles.chevronIcon}>
                        {isExpanded ? <BiChevronUp /> : <BiChevronDown />}
                    </span>
                </div>
            </div>

            {isExpanded && (
                <ExpandedRow
                    user={localUser}
                    editing={editing}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onEditClick={() => setEditing(true)}
                    onSave={handleSave}
                    onCancelEdit={() => setEditing(false)}
                    onDelete={handleDelete}
                />
            )}
        </div>
    );
};

// ── Main Panel ────────────────────────────────────────────────────────────────

interface Props {
    users: User[];
    onRefresh: () => Promise<void>;
}

const UserProfilesPanel = ({ users: initialUsers, onRefresh }: Props) => {
    const { role } = useUserDashboardStore();
    const canEdit   = role === "STAFF" || role === "ADMIN";
    const canDelete = role === "ADMIN";

    const [users,       setUsers]       = useState<User[]>(initialUsers);
    const [loading,     setLoading]     = useState(false);
    const [query,       setQuery]       = useState("");
    const [expandedId,  setExpandedId]  = useState<number | null>(null);
    const [selected,    setSelected]    = useState<Set<number>>(new Set());
    const [bulkDeleting, setBulkDeleting] = useState(false);

    useEffect(() => { setUsers(initialUsers); }, [initialUsers]);

    const fetchUsers = async () => {
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
        if (!window.confirm(`Delete ${selected.size} user${selected.size !== 1 ? "s" : ""}? This cannot be undone.`)) return;
        setBulkDeleting(true);
        const ids = [...selected];
        const results = await Promise.allSettled(ids.map((id) => deleteUser(id)));
        const deleted = ids.filter((_, i) => results[i].status === "fulfilled");
        const failed  = ids.filter((_, i) => results[i].status === "rejected");
        setUsers((prev) => prev.filter((u) => !deleted.includes(u.userId)));
        setSelected(new Set(failed));
        setBulkDeleting(false);
        if (failed.length) alert(`${failed.length} deletion(s) failed.`);
    };

    const filtered = users.filter((u) =>
        `${u.firstName} ${u.lastName} ${u.email} ${u.userId} ${u.phoneNumber}`
            .toLowerCase()
            .includes(query.toLowerCase()),
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h2 className="page-title">User Profiles</h2>
                    <p className="page-subtitle">
                        {filtered.length} of {users.length} users
                    </p>
                </div>
                <button
                    onClick={fetchUsers}
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
                    placeholder="Search by name, email, ID or phone…"
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
                <div className={styles.tableHeader} style={{ gridTemplateColumns: "28px 2fr 1fr 1fr 1fr auto" }}>
                    <div className={styles.cbCell}>
                        <input
                            type="checkbox"
                            className={styles.cb}
                            checked={filtered.length > 0 && filtered.every((u) => selected.has(u.userId))}
                            onChange={(e) => setSelected(e.target.checked ? new Set(filtered.map((u) => u.userId)) : new Set())}
                        />
                    </div>
                    {["User", "ID", "Phone", "Created", ""].map((h) => (
                        <p key={h} className={styles.columnLabel}>{h}</p>
                    ))}
                </div>

                <div className={styles.rowList}>
                    {loading ? (
                        <LoadingSkeleton label="Fetching user profiles…" />
                    ) : filtered.length === 0 ? (
                        <EmptyState icon={<BiUser />} message="No users match your search." />
                    ) : (
                        filtered.map((user) => (
                            <UserRow
                                key={user.userId}
                                user={user}
                                isExpanded={expandedId === user.userId}
                                onToggle={() => setExpandedId(expandedId === user.userId ? null : user.userId)}
                                canEdit={canEdit}
                                canDelete={canDelete}
                                isSelected={selected.has(user.userId)}
                                onSelect={() => toggleSelect(user.userId)}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfilesPanel;
