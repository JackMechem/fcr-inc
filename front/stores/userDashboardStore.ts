import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserDashboardView =
    | "reservations"
    | "edit-reservation"
    | "user-details"
    // Admin/Staff views
    | "admin-dashboard"
    | "add-car"
    | "edit-car"
    | "view-data"
    | "view-reservations"
    | "view-accounts"
    | "view-users"
    | "view-reviews"
    | "view-bookmarks"
    | "view-permissions-admin"
    | "view-permissions-staff"
    | "create-invoice"
    | "view-payments"
    | "list-data"
    | "list-reservations"
    | "list-accounts"
    | "list-users"
    | "list-reviews"
    | "list-payments"
    | "view-reservation";

export interface DashboardReservation {
    reservationId: number;
    car: { vin: string; make: string; model: string; images: string[] } | null;
    user: number | { userId: number; [key: string]: unknown };
    paymentIds: string[];
    pickUpTime: number | string;
    dropOffTime: number | string;
    dateBooked: number | string;
    duration: number;
    durationHours: number;
    durationDays: number;
}

export interface Session {
    token: string;
    accountId: number;
    stripeUserId: number | null;
    userEmail: string | null;
    userName: string | null;
    role: string;
    sessionExpiresAt: string;
}

interface UserDashboardStore {
    collapsed: boolean;
    activeView: UserDashboardView;

    // ── Multi-session ────────────────────────────────────────────────────────
    sessions: Session[];
    activeSessionIndex: number;

    // ── Active session (mirrors sessions[activeSessionIndex]) ─────────────
    accountId: number | null;
    stripeUserId: number | null;
    userEmail: string | null;
    userName: string | null;
    isAuthenticated: boolean;
    sessionToken: string | null;
    sessionExpiresAt: string | null;
    role: string | null;

    selectedReservation: DashboardReservation | null;
    reservations: DashboardReservation[];
    editVin: string | null;

    toggle: () => void;
    setActiveView: (view: UserDashboardView) => void;
    setAccountId: (id: number | null) => void;
    setUserEmail: (email: string | null) => void;
    setUserName: (name: string | null) => void;
    setAuthenticated: (value: boolean) => void;

    /**
     * Add or update a session. If a session with the same accountId already
     * exists, it is updated in place. Otherwise a new session is appended.
     * The store then switches to that session.
     */
    setSession: (token: string, accountId: number, role: string, expiresAt: string, stripeUserId?: number | null) => void;

    /** Remove the active session. If other sessions exist, switch to one of them. */
    clearSession: () => void;

    /** Switch to a different saved session by index. */
    switchSession: (index: number) => void;

    /** Remove a session by index (can be non-active). */
    removeSession: (index: number) => void;

    /** Sign out of all sessions. */
    clearAllSessions: () => void;

    setReservations: (reservations: DashboardReservation[]) => void;
    openReservation: (reservation: DashboardReservation) => void;
    openEditReservation: (reservation: DashboardReservation) => void;
    openEditCar: (vin: string) => void;
    setEditVin: (vin: string | null) => void;
}

function applySession(session: Session | undefined) {
    if (!session) {
        return {
            sessionToken: null,
            accountId: null,
            stripeUserId: null,
            role: null,
            sessionExpiresAt: null,
            isAuthenticated: false,
            userEmail: null,
            userName: null,
        };
    }
    return {
        sessionToken: session.token,
        accountId: session.accountId,
        stripeUserId: session.stripeUserId,
        role: session.role,
        sessionExpiresAt: session.sessionExpiresAt,
        isAuthenticated: true,
        userEmail: session.userEmail,
        userName: session.userName,
    };
}

export const useUserDashboardStore = create<UserDashboardStore>()(
    persist(
        (set, get) => ({
            collapsed: false,
            activeView: "reservations",
            sessions: [],
            activeSessionIndex: 0,
            accountId: null,
            stripeUserId: null,
            userEmail: null,
            userName: null,
            isAuthenticated: false,
            sessionToken: null,
            sessionExpiresAt: null,
            role: null,
            selectedReservation: null,
            reservations: [],
            editVin: null,

            toggle: () => set({ collapsed: !get().collapsed }),
            setActiveView: (view) => set({ activeView: view }),
            setAccountId: (id) => set({ accountId: id }),
            setUserEmail: (email) => {
                set({ userEmail: email });
                // Sync into sessions array
                const { sessions, activeSessionIndex } = get();
                if (sessions[activeSessionIndex]) {
                    const next = [...sessions];
                    next[activeSessionIndex] = { ...next[activeSessionIndex], userEmail: email };
                    set({ sessions: next });
                }
            },
            setUserName: (name) => {
                set({ userName: name });
                const { sessions, activeSessionIndex } = get();
                if (sessions[activeSessionIndex]) {
                    const next = [...sessions];
                    next[activeSessionIndex] = { ...next[activeSessionIndex], userName: name };
                    set({ sessions: next });
                }
            },
            setAuthenticated: (value) => set({ isAuthenticated: value }),

            setSession: (token, accountId, role, expiresAt, stripeUserId = null) => {
                const { sessions, sessionToken: existingToken, accountId: existingAcctId,
                        role: existingRole, sessionExpiresAt: existingExpiry,
                        stripeUserId: existingSuid, userEmail: existingEmail, userName: existingName } = get();

                // If no sessions array yet, migrate the current flat-field session first
                let base = [...sessions];
                if (base.length === 0 && existingToken && existingAcctId && existingRole && existingExpiry) {
                    base = [{
                        token: existingToken,
                        accountId: existingAcctId,
                        role: existingRole,
                        sessionExpiresAt: existingExpiry,
                        stripeUserId: existingSuid,
                        userEmail: existingEmail,
                        userName: existingName,
                    }];
                }

                const newSession: Session = {
                    token,
                    accountId,
                    role,
                    sessionExpiresAt: expiresAt,
                    stripeUserId,
                    userEmail: null,
                    userName: null,
                };
                const existing = base.findIndex((s) => s.accountId === accountId);
                let next: Session[];
                let idx: number;
                if (existing >= 0) {
                    next = [...base];
                    next[existing] = newSession;
                    idx = existing;
                } else {
                    next = [...base, newSession];
                    idx = next.length - 1;
                }
                set({ sessions: next, activeSessionIndex: idx, ...applySession(newSession) });
            },

            clearSession: () => {
                const { sessions, activeSessionIndex } = get();
                const next = sessions.filter((_, i) => i !== activeSessionIndex);
                if (next.length === 0) {
                    set({ sessions: [], activeSessionIndex: 0, ...applySession(undefined) });
                } else {
                    const newIdx = Math.min(activeSessionIndex, next.length - 1);
                    set({ sessions: next, activeSessionIndex: newIdx, ...applySession(next[newIdx]) });
                }
            },

            switchSession: (index) => {
                const { sessions } = get();
                const session = sessions[index];
                if (!session) return;
                set({ activeSessionIndex: index, ...applySession(session) });
            },

            removeSession: (index) => {
                const { sessions, activeSessionIndex } = get();
                const next = sessions.filter((_, i) => i !== index);
                if (next.length === 0) {
                    set({ sessions: [], activeSessionIndex: 0, ...applySession(undefined) });
                } else {
                    const newIdx = index < activeSessionIndex
                        ? activeSessionIndex - 1
                        : Math.min(activeSessionIndex, next.length - 1);
                    set({ sessions: next, activeSessionIndex: newIdx, ...applySession(next[newIdx]) });
                }
            },

            clearAllSessions: () =>
                set({ sessions: [], activeSessionIndex: 0, ...applySession(undefined) }),

            setReservations: (reservations) => set({ reservations }),
            openReservation: (reservation) =>
                set({ selectedReservation: reservation, activeView: "view-reservation" }),
            openEditReservation: (reservation) =>
                set({ selectedReservation: reservation, activeView: "edit-reservation" }),
            openEditCar: (vin) => set({ activeView: "edit-car", editVin: vin }),
            setEditVin: (vin) => set({ editVin: vin }),
        }),
        {
            name: "user-dashboard",
            onRehydrateStorage: () => (state) => {
                if (!state) return;
                // Migrate pre-multi-session data: if sessions is empty but flat fields have a valid session, seed it in.
                if (state.sessions.length === 0 && state.sessionToken && state.accountId && state.role && state.sessionExpiresAt) {
                    state.sessions = [{
                        token: state.sessionToken,
                        accountId: state.accountId,
                        role: state.role,
                        sessionExpiresAt: state.sessionExpiresAt,
                        stripeUserId: state.stripeUserId,
                        userEmail: state.userEmail,
                        userName: state.userName,
                    }];
                    state.activeSessionIndex = 0;
                }
            },
            partialize: (state) => ({
                collapsed: state.collapsed,
                sessions: state.sessions,
                activeSessionIndex: state.activeSessionIndex,
                sessionToken: state.sessionToken,
                accountId: state.accountId,
                stripeUserId: state.stripeUserId,
                role: state.role,
                userEmail: state.userEmail,
                userName: state.userName,
                sessionExpiresAt: state.sessionExpiresAt,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
