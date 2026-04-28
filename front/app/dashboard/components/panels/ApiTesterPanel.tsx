"use client";

import { useState, useCallback } from "react";
import { BiPlay, BiRefresh, BiCheck, BiX, BiChevronDown } from "react-icons/bi";
import styles from "./panels.module.css";

// ── Types ─────────────────────────────────────────────────────────────────────

type StepStatus = "idle" | "running" | "success" | "error";
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface StepDef {
    name: string;
    description?: string;
    method: HttpMethod;
    url: string;
    defaultParams?: Record<string, string>;
    defaultBody?: unknown;
    extractVars?: Record<string, string>;
}

interface FlowDef {
    name: string;
    description: string;
    steps: StepDef[];
    initialVars?: Record<string, string>;
}

interface StepState {
    paramsStr: string;
    bodyStr: string;
    status: StepStatus;
    resolvedUrl: string | null;
    response: { statusCode: number; body: unknown } | null;
    error: string | null;
    open: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolveVars(template: string, vars: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
}

function deepResolveVars(val: unknown, vars: Record<string, string>): unknown {
    return JSON.parse(resolveVars(JSON.stringify(val), vars));
}

function extractVarsFromResponse(body: unknown, extractors: Record<string, string>): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [varName, path] of Object.entries(extractors)) {
        try {
            const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".");
            let cur: unknown = body;
            for (const p of parts) {
                if (cur == null || typeof cur !== "object") { cur = undefined; break; }
                cur = (cur as Record<string, unknown>)[p];
            }
            if (cur != null) result[varName] = String(cur);
        } catch { /* skip */ }
    }
    return result;
}

function defaultStepState(step: StepDef): StepState {
    return {
        paramsStr: step.defaultParams ? JSON.stringify(step.defaultParams, null, 2) : "",
        bodyStr:   step.defaultBody   ? JSON.stringify(step.defaultBody,   null, 2) : "",
        status: "idle",
        resolvedUrl: null,
        response: null,
        error: null,
        open: true,
    };
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const pad2 = (n: number) => String(n).padStart(2, "0");
const fmtDate = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} 10:00:00`;

const MOCK_PICKUP  = fmtDate(new Date(Date.now() + 86400000));
const MOCK_DROPOFF = fmtDate(new Date(Date.now() + 4 * 86400000));

// ── Flow definitions ──────────────────────────────────────────────────────────

const GUEST_CHECKOUT_FLOW: FlowDef = {
    name: "Guest Checkout",
    description: "Fetches an available car then creates a Stripe payment intent using mock guest data. The car VIN is automatically extracted from step 1 into {{carVin}} and substituted into step 2.",
    steps: [
        {
            name: "Fetch Available Cars",
            description: "GET /api/cars sorted cheapest first. First result's VIN is extracted as {{carVin}}.",
            method: "GET",
            url: "/api/cars",
            defaultParams: { pageSize: "5", sortBy: "pricePerDay", sortDir: "asc" },
            extractVars: { carVin: "data[0].vin" },
        },
        {
            name: "Create Payment Intent",
            description: "Creates a Stripe user + payment intent using mock guest info and {{carVin}} from step 1.",
            method: "POST",
            url: "/api/payment-intent",
            defaultBody: {
                userInfo: {
                    firstName: "Alex",
                    lastName: "Johnson",
                    email: "alex.johnson.test@example.com",
                    phone: "555-867-5309",
                    dob: "1990-03-15",
                    driversLicense: {
                        driversLicense: "DL-TEST-2024-AJ",
                        expDate: "2028-03-15",
                        state: "IL",
                    },
                },
                cars: [{ vin: "{{carVin}}", pickUpTime: MOCK_PICKUP, dropOffTime: MOCK_DROPOFF }],
            },
        },
    ],
    initialVars: {},
};

const CREATE_RESERVATION_FLOW: FlowDef = {
    name: "Create Reservation (Direct)",
    description: "Fetches a car to get a VIN, then POSTs a reservation for a user, then verifies it exists. Edit userId in step 2 as needed.",
    steps: [
        {
            name: "Fetch Cars",
            description: "GET /api/cars — first result's VIN is extracted as {{carVin}}.",
            method: "GET",
            url: "/api/cars",
            defaultParams: { pageSize: "5" },
            extractVars: { carVin: "data[0].vin" },
        },
        {
            name: "Create Reservation",
            description: "POST a reservation directly. {{carVin}} is substituted from step 1.",
            method: "POST",
            url: "/api/reservations",
            defaultBody: {
                car: "{{carVin}}",
                user: 2,
                pickUpTime: MOCK_PICKUP,
                dropOffTime: MOCK_DROPOFF,
                dateBooked: fmtDate(new Date()),
                payments: [],
            },
            extractVars: { reservationId: "reservationId" },
        },
        {
            name: "Verify — List User Reservations",
            description: "Confirms the reservation was created by fetching the user's most recent bookings.",
            method: "GET",
            url: "/api/reservations",
            defaultParams: { user: "2", pageSize: "5", sortBy: "dateBooked", sortDir: "desc" },
        },
    ],
    initialVars: {},
};

const STRIPE_WEBHOOK_FLOW: FlowDef = {
    name: "Mock Stripe Webhook",
    description: "Fires a mock payment_intent.succeeded event to the backend via the dev proxy. Edit the target URL in the body if your backend runs on a different port.",
    steps: [
        {
            name: "Send Webhook Event",
            description: "POSTs a mock payment_intent.succeeded event through /api/dev-proxy to the backend Stripe webhook endpoint.",
            method: "POST",
            url: "/api/dev-proxy",
            defaultBody: {
                url: "http://localhost:8080/stripe/webhook",
                method: "POST",
                body: {
                    id: "evt_test_mock_001",
                    object: "event",
                    type: "payment_intent.succeeded",
                    data: {
                        object: {
                            id: "pi_test_mock_001",
                            object: "payment_intent",
                            amount: 15000,
                            currency: "usd",
                            status: "succeeded",
                            metadata: { userId: "2" },
                        },
                    },
                },
            },
        },
    ],
    initialVars: {},
};

// ── Step row ──────────────────────────────────────────────────────────────────

function StepRow({ idx, step, state, disabled, onChange, onRun }: {
    idx: number;
    step: StepDef;
    state: StepState;
    disabled: boolean;
    onChange: (patch: Partial<StepState>) => void;
    onRun: () => void;
}) {
    let paramsInvalid = false;
    let bodyInvalid = false;
    try { if (state.paramsStr.trim()) JSON.parse(state.paramsStr); } catch { paramsInvalid = true; }
    try { if (state.bodyStr.trim())   JSON.parse(state.bodyStr);   } catch { bodyInvalid = true; }

    const showParams = step.method === "GET";
    const showBody   = step.method !== "GET";

    const statusIcon =
        state.status === "success" ? <BiCheck style={{ fontSize: 13 }} /> :
        state.status === "error"   ? <BiX     style={{ fontSize: 13 }} /> :
        null;

    const statusLabel =
        state.status === "running" ? "Running…" :
        state.status === "success" ? "OK" :
        state.status === "error"   ? "Error" : "Idle";

    return (
        <div className={`${styles.listRow} ${state.open ? "" : styles.listRowBorder}`}>
            {/* Summary row */}
            <div style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 18px",
                borderBottom: state.open ? "1px solid var(--color-third)" : "none",
            }}>
                {/* Step number */}
                <span className={styles.listGroupCount} style={{ minWidth: 24, textAlign: "center", flexShrink: 0 }}>
                    {idx + 1}
                </span>

                {/* Name + desc */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-foreground)", margin: 0 }}>
                        {step.name}
                    </p>
                    {step.description && (
                        <p style={{ fontSize: 11, color: "var(--color-foreground-light)", margin: "1px 0 0" }}>
                            {step.description}
                        </p>
                    )}
                </div>

                {/* Method + URL */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <span style={{
                        fontSize: 10, fontWeight: 700, fontFamily: "monospace",
                        padding: "1px 5px", borderRadius: 3,
                        color: "var(--color-foreground-light)",
                        background: "var(--color-third)",
                    }}>
                        {step.method}
                    </span>
                    <code style={{ fontSize: 11, color: "var(--color-foreground-light)" }}>
                        {step.url}
                    </code>
                </div>

                {/* Status */}
                <span style={{
                    display: "flex", alignItems: "center", gap: 3,
                    fontSize: 11, fontWeight: 600, flexShrink: 0,
                    color: state.status === "idle" ? "var(--color-foreground-light)" : "var(--color-foreground)",
                    opacity: state.status === "idle" ? 0.6 : 1,
                }}>
                    {statusIcon}{statusLabel}
                </span>

                {/* Run button */}
                <button
                    onClick={onRun}
                    disabled={disabled || state.status === "running"}
                    className={styles.editBtn}
                    style={{ padding: "5px 12px", fontSize: 12, gap: 4, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1 }}
                >
                    <BiPlay style={{ fontSize: 13 }} /> Run
                </button>

                {/* Collapse toggle */}
                <button
                    onClick={() => onChange({ open: !state.open })}
                    style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "var(--color-foreground-light)", padding: 2, flexShrink: 0,
                    }}
                >
                    <BiChevronDown className={styles.rowChevron} style={{ transform: state.open ? "rotate(-180deg)" : undefined }} />
                </button>
            </div>

            {/* Expanded body */}
            {state.open && (
                <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
                    {/* Params / body editor */}
                    {showParams && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                            <p className={styles.listGroupTitle} style={{ marginBottom: 0 }}>
                                Query Params
                                {paramsInvalid && <span style={{ color: "var(--color-accent)", marginLeft: 6, textTransform: "none", letterSpacing: 0 }}>— invalid JSON</span>}
                            </p>
                            <textarea
                                value={state.paramsStr}
                                onChange={(e) => onChange({ paramsStr: e.target.value })}
                                disabled={disabled}
                                spellCheck={false}
                                style={{
                                    width: "100%", minHeight: 90, resize: "vertical",
                                    background: "var(--color-primary-dark)",
                                    color: "var(--color-foreground)",
                                    border: `1px solid ${paramsInvalid ? "var(--color-accent)" : "var(--color-third)"}`,
                                    borderRadius: 8, padding: "8px 10px",
                                    fontSize: 12, fontFamily: "monospace", lineHeight: 1.6,
                                    boxSizing: "border-box", outline: "none",
                                }}
                            />
                        </div>
                    )}
                    {showBody && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                            <p className={styles.listGroupTitle} style={{ marginBottom: 0 }}>
                                Request Body
                                {bodyInvalid && <span style={{ color: "var(--color-accent)", marginLeft: 6, textTransform: "none", letterSpacing: 0 }}>— invalid JSON</span>}
                            </p>
                            <textarea
                                value={state.bodyStr}
                                onChange={(e) => onChange({ bodyStr: e.target.value })}
                                disabled={disabled}
                                spellCheck={false}
                                style={{
                                    width: "100%", minHeight: 120, resize: "vertical",
                                    background: "var(--color-primary-dark)",
                                    color: "var(--color-foreground)",
                                    border: `1px solid ${bodyInvalid ? "var(--color-accent)" : "var(--color-third)"}`,
                                    borderRadius: 8, padding: "8px 10px",
                                    fontSize: 12, fontFamily: "monospace", lineHeight: 1.6,
                                    boxSizing: "border-box", outline: "none",
                                }}
                            />
                        </div>
                    )}

                    {/* Extracts */}
                    {step.extractVars && (
                        <p style={{ fontSize: 11, color: "var(--color-foreground-light)", margin: 0 }}>
                            <span className={styles.listGroupTitle} style={{ display: "inline", fontSize: 10 }}>Extracts </span>
                            {Object.entries(step.extractVars).map(([k, v]) => (
                                <code key={k} style={{
                                    marginLeft: 6, padding: "1px 6px", borderRadius: 4,
                                    background: "var(--color-third)", fontFamily: "monospace", fontSize: 11,
                                }}>
                                    {`{{${k}}}`} ← {v}
                                </code>
                            ))}
                        </p>
                    )}

                    {/* Response */}
                    {(state.response || state.error) && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                            <p className={styles.listGroupTitle} style={{ marginBottom: 0 }}>Response</p>
                            <div style={{
                                border: "1px solid var(--color-third)", borderRadius: 8, overflow: "hidden",
                            }}>
                                {state.resolvedUrl && (
                                    <div style={{
                                        padding: "6px 10px",
                                        background: "var(--color-primary-dark)",
                                        borderBottom: "1px solid var(--color-third)",
                                        display: "flex", alignItems: "center", gap: 8,
                                    }}>
                                        {state.response && (
                                            <span style={{
                                                fontSize: 11, fontWeight: 700,
                                                fontFamily: "monospace",
                                                color: "var(--color-foreground)",
                                                background: "var(--color-third)",
                                                padding: "0 6px", borderRadius: 3,
                                            }}>
                                                {state.response.statusCode}
                                            </span>
                                        )}
                                        <code style={{ fontSize: 11, color: "var(--color-foreground-light)", wordBreak: "break-all" }}>
                                            {state.resolvedUrl}
                                        </code>
                                    </div>
                                )}
                                {state.error && !state.response ? (
                                    <p style={{ margin: 0, padding: "10px 12px", fontSize: 12, color: "var(--color-accent)", fontFamily: "monospace" }}>
                                        {state.error}
                                    </p>
                                ) : state.response && (
                                    <pre style={{
                                        margin: 0, padding: "10px 12px",
                                        fontSize: 11, lineHeight: 1.7,
                                        color: "var(--color-foreground)",
                                        fontFamily: "monospace",
                                        overflowX: "auto", maxHeight: 340,
                                        background: "var(--color-primary)",
                                    }}>
                                        {typeof state.response.body === "string"
                                            ? state.response.body
                                            : JSON.stringify(state.response.body, null, 2)}
                                    </pre>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Flow runner ───────────────────────────────────────────────────────────────

function FlowRunner({ flow }: { flow: FlowDef }) {
    const [stepStates, setStepStates] = useState<StepState[]>(() => flow.steps.map(defaultStepState));
    const [vars, setVars] = useState<Record<string, string>>(flow.initialVars ?? {});
    const [runningAll, setRunningAll] = useState(false);

    const updateStep = useCallback((idx: number, patch: Partial<StepState>) => {
        setStepStates((prev) => prev.map((s, i) => i === idx ? { ...s, ...patch } : s));
    }, []);

    const execStep = useCallback(async (
        idx: number,
        currentVars: Record<string, string>,
        snapshot: StepState[],
    ): Promise<{ ok: boolean; newVars: Record<string, string> }> => {
        const step  = flow.steps[idx];
        const state = snapshot[idx];

        setStepStates((prev) => prev.map((s, i) => i === idx ? { ...s, status: "running" } : s));

        let params: Record<string, string> | undefined;
        let body: unknown;

        try {
            if (state.paramsStr.trim()) params = JSON.parse(state.paramsStr) as Record<string, string>;
        } catch {
            setStepStates((prev) => prev.map((s, i) => i === idx ? { ...s, status: "error", error: "Invalid JSON in Query Params" } : s));
            return { ok: false, newVars: {} };
        }
        try {
            if (state.bodyStr.trim()) body = JSON.parse(state.bodyStr);
        } catch {
            setStepStates((prev) => prev.map((s, i) => i === idx ? { ...s, status: "error", error: "Invalid JSON in Request Body" } : s));
            return { ok: false, newVars: {} };
        }

        const rUrl    = resolveVars(step.url, currentVars);
        const rParams = params ? deepResolveVars(params, currentVars) as Record<string, string> : undefined;
        const rBody   = body   ? deepResolveVars(body,   currentVars) : undefined;

        let fullUrl = rUrl;
        if (rParams && Object.keys(rParams).length > 0) {
            fullUrl += "?" + new URLSearchParams(rParams).toString();
        }

        try {
            const fetchOpts: RequestInit = { method: step.method };
            if (rBody != null) {
                fetchOpts.body    = JSON.stringify(rBody);
                fetchOpts.headers = { "Content-Type": "application/json" };
            }
            const res = await fetch(fullUrl, fetchOpts);
            const ct  = res.headers.get("content-type") ?? "";
            const resBody: unknown = ct.includes("application/json") ? await res.json() : await res.text();

            const extracted = (step.extractVars && res.ok)
                ? extractVarsFromResponse(resBody, step.extractVars)
                : {};

            setStepStates((prev) => prev.map((s, i) => i === idx ? {
                ...s, status: res.ok ? "success" : "error",
                resolvedUrl: fullUrl,
                response: { statusCode: res.status, body: resBody },
                error: null, open: true,
            } : s));

            return { ok: res.ok, newVars: extracted };
        } catch (err) {
            setStepStates((prev) => prev.map((s, i) => i === idx ? {
                ...s, status: "error", error: String(err), resolvedUrl: fullUrl,
            } : s));
            return { ok: false, newVars: {} };
        }
    }, [flow.steps]);

    const runAll = useCallback(async () => {
        setRunningAll(true);
        let currentVars: Record<string, string> = { ...(flow.initialVars ?? {}) };
        setVars(currentVars);
        let snapshot: StepState[] = [];
        setStepStates((prev) => { snapshot = prev; return prev; });

        for (let i = 0; i < flow.steps.length; i++) {
            const { ok, newVars } = await execStep(i, currentVars, snapshot);
            currentVars = { ...currentVars, ...newVars };
            setVars({ ...currentVars });
            if (!ok) break;
        }
        setRunningAll(false);
    }, [flow, execStep]);

    const runSingle = useCallback(async (idx: number) => {
        let snapshot: StepState[] = [];
        setStepStates((prev) => { snapshot = prev; return prev; });
        const { newVars } = await execStep(idx, vars, snapshot);
        setVars((prev) => ({ ...prev, ...newVars }));
    }, [execStep, vars]);

    const reset = useCallback(() => {
        setStepStates(flow.steps.map(defaultStepState));
        setVars(flow.initialVars ?? {});
        setRunningAll(false);
    }, [flow]);

    const extractedVars = Object.entries(vars);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Controls */}
            <div style={{
                display: "flex", alignItems: "flex-start", gap: 14,
                padding: "14px 18px",
                background: "var(--color-primary)",
                border: "1px solid var(--color-third)",
                borderRadius: 14,
            }}>
                <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, color: "var(--color-foreground-light)", margin: 0, lineHeight: 1.6 }}>
                        {flow.description}
                    </p>
                    {extractedVars.length > 0 && (
                        <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
                            <span className={styles.listGroupTitle} style={{ fontSize: 9, display: "inline" }}>Extracted vars</span>
                            {extractedVars.map(([k, v]) => (
                                <code key={k} style={{
                                    fontSize: 10, fontFamily: "monospace",
                                    background: "var(--color-third)",
                                    color: "var(--color-foreground-light)",
                                    padding: "1px 7px", borderRadius: 4,
                                }}>
                                    {`{{${k}}}`} = {v.length > 28 ? v.slice(0, 28) + "…" : v}
                                </code>
                            ))}
                        </div>
                    )}
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button onClick={reset} disabled={runningAll} className={styles.cancelBtn} style={{ padding: "6px 14px", fontSize: 12, gap: 5 }}>
                        <BiRefresh style={{ fontSize: 14 }} /> Reset
                    </button>
                    <button onClick={runAll} disabled={runningAll} className={styles.editBtn} style={{ padding: "6px 14px", fontSize: 12, gap: 5, opacity: runningAll ? 0.6 : 1, cursor: runningAll ? "not-allowed" : "pointer" }}>
                        <BiPlay style={{ fontSize: 14 }} /> Run All
                    </button>
                </div>
            </div>

            {/* Steps list */}
            <div className={styles.listGroup}>
                <div className={styles.listGroupHeader}>
                    <span className={styles.listGroupTitle}>Steps</span>
                    <span className={styles.listGroupCount}>{flow.steps.length}</span>
                </div>
                {stepStates.map((state, idx) => (
                    <div key={idx} className={styles.listRowBorder}>
                        <StepRow
                            idx={idx}
                            step={flow.steps[idx]}
                            state={state}
                            disabled={runningAll}
                            onChange={(patch) => updateStep(idx, patch)}
                            onRun={() => runSingle(idx)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

type FlowKey = "guest-checkout" | "create-reservation" | "stripe-webhook";

const FLOWS: Record<FlowKey, FlowDef> = {
    "guest-checkout":     GUEST_CHECKOUT_FLOW,
    "create-reservation": CREATE_RESERVATION_FLOW,
    "stripe-webhook":     STRIPE_WEBHOOK_FLOW,
};

const FLOW_LABELS: Record<FlowKey, string> = {
    "guest-checkout":     "Guest Checkout",
    "create-reservation": "Create Reservation",
    "stripe-webhook":     "Mock Stripe Webhook",
};

export default function ApiTesterPanel({ flowKey }: { flowKey: FlowKey }) {
    const flow = FLOWS[flowKey];
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className="page-title">API Tester — {FLOW_LABELS[flowKey]}</h1>
                <p className="page-subtitle">Admin only · Variables extracted between steps · All params editable</p>
            </div>
            <FlowRunner key={flowKey} flow={flow} />
        </div>
    );
}
