"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSidebarStore } from "@/stores/sidebarStore";
import { useDevConsoleStore, RequestLog } from "@/stores/devConsoleStore";
import { useUserDashboardStore } from "@/stores/userDashboardStore";
import { IoClose } from "react-icons/io5";
import { BiTrash, BiChevronDown, BiChevronRight, BiSend, BiRefresh } from "react-icons/bi";
import styles from "./devConsole.module.css";

// ── Route Runner catalog ──────────────────────────────────────────────────────

type RouteParam = { key: string; placeholder: string; defaultValue?: string };
type RouteRequest = {
    id: string;
    label: string;
    method: string;
    urlTemplate: string;
    params?: RouteParam[];
    body?: Record<string, unknown>;
};
type RouteSection = { route: string; label: string; requests: RouteRequest[] };

const ROUTE_SECTIONS: RouteSection[] = [
    {
        route: "/",
        label: "Home",
        requests: [
            {
                id: "home-featured",
                label: "Featured Cars",
                method: "GET",
                urlTemplate: "/api/cars?pageSize=8&page=1&sortBy=pricePerDay&sortDir=desc",
            },
            {
                id: "home-brand-scroll",
                label: "Brand Scroll",
                method: "GET",
                urlTemplate: "/api/cars?pageSize=1&page=1&sortBy=pricePerDay&make={make}",
                params: [{ key: "make", placeholder: "Make", defaultValue: "BMW" }],
            },
        ],
    },
    {
        route: "/browse",
        label: "Browse",
        requests: [
            {
                id: "browse-cars",
                label: "Car Listing",
                method: "GET",
                urlTemplate: "/api/cars?page=1&pageSize=12",
            },
            {
                id: "browse-enums",
                label: "Filter Enums",
                method: "GET",
                urlTemplate: "/api/enums",
            },
        ],
    },
    {
        route: "/car/[slug]",
        label: "Car Detail",
        requests: [
            {
                id: "car-detail",
                label: "Car Details",
                method: "GET",
                urlTemplate: "/api/cars/{vin}",
                params: [{ key: "vin", placeholder: "VIN" }],
            },
            {
                id: "car-reviews",
                label: "Car Reviews",
                method: "GET",
                urlTemplate: "/api/reviews?car={vin}",
                params: [{ key: "vin", placeholder: "VIN" }],
            },
            {
                id: "car-similar",
                label: "Similar Cars",
                method: "GET",
                urlTemplate: "/api/cars?make={make}&pageSize=7",
                params: [{ key: "make", placeholder: "Make" }],
            },
        ],
    },
    {
        route: "/checkout",
        label: "Checkout",
        requests: [
            {
                id: "checkout-user",
                label: "User Data",
                method: "GET",
                urlTemplate: "/api/users/{userId}",
                params: [{ key: "userId", placeholder: "User ID" }],
            },
            {
                id: "checkout-user-lookup",
                label: "User Lookup by Email",
                method: "GET",
                urlTemplate: "/api/user-lookup?email={email}",
                params: [{ key: "email", placeholder: "Email" }],
            },
            {
                id: "checkout-check-account",
                label: "Check Account Exists",
                method: "GET",
                urlTemplate: "/api/auth/check-account?email={email}",
                params: [{ key: "email", placeholder: "Email" }],
            },
        ],
    },
    {
        route: "/login",
        label: "Login",
        requests: [
            {
                id: "login-magic-link",
                label: "Send Magic Link",
                method: "POST",
                urlTemplate: "/api/auth/magic-link",
                body: { email: "{email}" },
                params: [{ key: "email", placeholder: "Email" }],
            },
            {
                id: "login-check-account",
                label: "Check Account",
                method: "GET",
                urlTemplate: "/api/auth/check-account?email={email}",
                params: [{ key: "email", placeholder: "Email" }],
            },
        ],
    },
    {
        route: "/register",
        label: "Register",
        requests: [
            {
                id: "register-check-account",
                label: "Check Account Exists",
                method: "GET",
                urlTemplate: "/api/auth/check-account?email={email}",
                params: [{ key: "email", placeholder: "Email" }],
            },
        ],
    },
    {
        route: "/dashboard",
        label: "Dashboard",
        requests: [
            {
                id: "dashboard-user",
                label: "Get User",
                method: "GET",
                urlTemplate: "/api/users/{userId}",
                params: [{ key: "userId", placeholder: "User ID" }],
            },
            {
                id: "dashboard-account",
                label: "Get Account",
                method: "GET",
                urlTemplate: "/api/accounts/{acctId}",
                params: [{ key: "acctId", placeholder: "Account ID" }],
            },
            {
                id: "dashboard-reservations",
                label: "User Reservations",
                method: "GET",
                urlTemplate: "/api/reservations?userId={userId}&pageSize=10&parseFullObjects=true",
                params: [{ key: "userId", placeholder: "User ID" }],
            },
            {
                id: "dashboard-payments",
                label: "User Payments",
                method: "GET",
                urlTemplate: "/api/users/{userId}/payments?page=1&pageSize=10",
                params: [{ key: "userId", placeholder: "User ID" }],
            },
            {
                id: "dashboard-reviews",
                label: "Account Reviews",
                method: "GET",
                urlTemplate: "/api/reviews?account={acctId}&pageSize=500",
                params: [{ key: "acctId", placeholder: "Account ID" }],
            },
        ],
    },
    {
        route: "/admin",
        label: "Admin",
        requests: [
            {
                id: "admin-cars",
                label: "All Cars",
                method: "GET",
                urlTemplate: "/api/cars?page=1&pageSize=10",
            },
            {
                id: "admin-accounts",
                label: "All Accounts",
                method: "GET",
                urlTemplate: "/api/accounts?page=1&pageSize=10",
            },
            {
                id: "admin-users",
                label: "All Users",
                method: "GET",
                urlTemplate: "/api/users?page=1&pageSize=10",
            },
            {
                id: "admin-reservations",
                label: "All Reservations",
                method: "GET",
                urlTemplate: "/api/reservations?page=1&pageSize=10",
            },
            {
                id: "admin-reviews",
                label: "All Reviews",
                method: "GET",
                urlTemplate: "/api/reviews?page=1&pageSize=10",
            },
            {
                id: "admin-stats-revenue",
                label: "Revenue Stats",
                method: "GET",
                urlTemplate: "/api/stats/revenue",
            },
            {
                id: "admin-stats-popularity",
                label: "Popularity Stats",
                method: "GET",
                urlTemplate: "/api/stats/popularity",
            },
        ],
    },
    {
        route: "/compare",
        label: "Compare",
        requests: [
            {
                id: "compare-car-a",
                label: "Car A Details",
                method: "GET",
                urlTemplate: "/api/cars/{vinA}",
                params: [{ key: "vinA", placeholder: "VIN A" }],
            },
            {
                id: "compare-car-b",
                label: "Car B Details",
                method: "GET",
                urlTemplate: "/api/cars/{vinB}",
                params: [{ key: "vinB", placeholder: "VIN B" }],
            },
        ],
    },
];

function substituteParams(template: string, params: Record<string, string>): string {
    return template.replace(/\{(\w+)\}/g, (_, key) => encodeURIComponent(params[key] ?? ""));
}

function substituteBody(
    body: Record<string, unknown> | undefined,
    params: Record<string, string>,
): Record<string, unknown> | undefined {
    if (!body) return undefined;
    const str = JSON.stringify(body).replace(/"\{(\w+)\}"/g, (_, key) =>
        JSON.stringify(params[key] ?? ""),
    );
    return JSON.parse(str);
}

type ReqRunState = {
    paramValues: Record<string, string>;
    response: { status: number; body: unknown } | null;
    error: string | null;
    loading: boolean;
    respExpanded: boolean;
};

function defaultRunState(req: RouteRequest): ReqRunState {
    return {
        paramValues: Object.fromEntries(
            (req.params ?? []).map((p) => [p.key, p.defaultValue ?? ""]),
        ),
        response: null,
        error: null,
        loading: false,
        respExpanded: false,
    };
}

const METHOD_COLORS: Record<string, string> = {
    GET: "#22c55e",
    POST: "#3b82f6",
    PUT: "#f59e0b",
    PATCH: "#f59e0b",
    DELETE: "#ef4444",
};

function formatTime(date: Date) {
    return date.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

function StatusBadge({ status }: { status: number | null }) {
    const color =
        status === null
            ? "#6b7280"
            : status < 300
                ? "#22c55e"
                : status < 400
                    ? "#f59e0b"
                    : "#ef4444";
    return (
        <span className={styles.statusBadge} style={{ color }}>
            {status ?? "ERR"}
        </span>
    );
}

function LogEntry({ log }: { log: RequestLog }) {
    const [expanded, setExpanded] = useState(false);
    const methodColor = METHOD_COLORS[log.method] ?? "#a855f7";

    return (
        <div className={styles.logEntry}>
            <button
                className={styles.logSummary}
                onClick={() => setExpanded((v) => !v)}
            >
                <span className={styles.expandIcon}>
                    {expanded ? <BiChevronDown /> : <BiChevronRight />}
                </span>
                <span
                    className={styles.methodBadge}
                    style={{ background: `${methodColor}22`, color: methodColor }}
                >
                    {log.method}
                </span>
                <StatusBadge status={log.status} />
                <span className={styles.logUrlGroup}>
                    <span className={styles.logUrl}>{log.url}</span>
                    <span className={styles.logBackendUrl}>{log.backendUrl}</span>
                </span>
                <span className={styles.logMeta}>
                    {log.duration != null ? `${log.duration}ms` : ""}
                </span>
                <span className={styles.logTime}>{formatTime(log.timestamp)}</span>
            </button>

            {expanded && (
                <div className={styles.logDetail}>
                    {log.error && (
                        <div className={styles.detailBlock}>
                            <p className={styles.detailLabel}>Error</p>
                            <pre className={`${styles.detailPre} ${styles.detailError}`}>
                                {log.error}
                            </pre>
                        </div>
                    )}
                    {log.requestBody !== undefined && (
                        <div className={styles.detailBlock}>
                            <p className={styles.detailLabel}>Request Body</p>
                            <pre className={styles.detailPre}>
                                {JSON.stringify(log.requestBody, null, 2)}
                            </pre>
                        </div>
                    )}
                    <div className={styles.detailBlock}>
                        <p className={styles.detailLabel}>Response</p>
                        <pre className={styles.detailPre}>
                            {log.responseBody !== null && log.responseBody !== undefined
                                ? JSON.stringify(log.responseBody, null, 2).replace(/\\n/g, "\n")
                                : "(empty)"}
                        </pre>
                    </div>
                    <div className={styles.detailBlock}>
                        <p className={styles.detailLabel}>Next.js Route</p>
                        <pre className={styles.detailPre}>{log.url}</pre>
                    </div>
                    <div className={styles.detailBlock}>
                        <p className={styles.detailLabel}>Backend URL</p>
                        <pre className={styles.detailPre}>{log.backendUrl}</pre>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Route Runner Panel ────────────────────────────────────────────────────────

function RunnerPanel() {
    const { sessionToken } = useUserDashboardStore();

    const [expandedRoutes, setExpandedRoutes] = useState<Set<string>>(
        () => new Set(ROUTE_SECTIONS.map((s) => s.route)),
    );

    const [reqStates, setReqStates] = useState<Record<string, ReqRunState>>(() => {
        const init: Record<string, ReqRunState> = {};
        for (const section of ROUTE_SECTIONS)
            for (const req of section.requests)
                init[req.id] = defaultRunState(req);
        return init;
    });

    const toggleRoute = (route: string) =>
        setExpandedRoutes((prev) => {
            const next = new Set(prev);
            if (next.has(route)) next.delete(route);
            else next.add(route);
            return next;
        });

    const updateParam = (reqId: string, key: string, value: string) =>
        setReqStates((prev) => ({
            ...prev,
            [reqId]: {
                ...prev[reqId],
                paramValues: { ...prev[reqId].paramValues, [key]: value },
            },
        }));

    const runRequest = async (req: RouteRequest) => {
        const state = reqStates[req.id];
        const rawUrl = substituteParams(req.urlTemplate, state.paramValues);
        const url = rawUrl.startsWith("/") ? `${window.location.origin}${rawUrl}` : rawUrl;
        const body = substituteBody(req.body, state.paramValues);

        setReqStates((prev) => ({
            ...prev,
            [req.id]: { ...prev[req.id], loading: true, response: null, error: null },
        }));

        try {
            const res = await fetch("/api/dev-proxy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url, method: req.method, body, token: sessionToken }),
            });
            const data = await res.json();
            if (data.error) {
                setReqStates((prev) => ({
                    ...prev,
                    [req.id]: { ...prev[req.id], loading: false, error: data.error, respExpanded: true },
                }));
            } else {
                setReqStates((prev) => ({
                    ...prev,
                    [req.id]: { ...prev[req.id], loading: false, response: { status: data.status, body: data.body }, respExpanded: true },
                }));
            }
        } catch (e) {
            setReqStates((prev) => ({
                ...prev,
                [req.id]: { ...prev[req.id], loading: false, error: String(e), respExpanded: true },
            }));
        }
    };

    const toggleResp = (reqId: string) =>
        setReqStates((prev) => ({
            ...prev,
            [reqId]: { ...prev[reqId], respExpanded: !prev[reqId].respExpanded },
        }));

    return (
        <div className={styles.runnerPanel}>
            {ROUTE_SECTIONS.map((section) => {
                const isOpen = expandedRoutes.has(section.route);
                return (
                    <div key={section.route} className={styles.routeSection}>
                        <button
                            className={styles.routeHeader}
                            onClick={() => toggleRoute(section.route)}
                        >
                            <span className={styles.expandIcon}>
                                {isOpen ? <BiChevronDown /> : <BiChevronRight />}
                            </span>
                            <span className={styles.routeLabel}>{section.label}</span>
                            <span className={styles.routePath}>{section.route}</span>
                        </button>

                        {isOpen && (
                            <div className={styles.routeRequests}>
                                {section.requests.map((req) => {
                                    const state = reqStates[req.id];
                                    const methodColor = METHOD_COLORS[req.method] ?? "#a855f7";
                                    const hasResponse = state.response !== null || state.error !== null;

                                    return (
                                        <div key={req.id} className={styles.runnerReq}>
                                            <div className={styles.runnerReqRow}>
                                                <span
                                                    className={styles.methodBadge}
                                                    style={{ background: `${methodColor}22`, color: methodColor }}
                                                >
                                                    {req.method}
                                                </span>
                                                <span className={styles.runnerReqLabel}>{req.label}</span>
                                                {hasResponse && (
                                                    <button
                                                        className={styles.runnerRespToggle}
                                                        onClick={() => toggleResp(req.id)}
                                                        title="Toggle response"
                                                    >
                                                        <StatusBadge status={state.response?.status ?? null} />
                                                    </button>
                                                )}
                                                <button
                                                    className={styles.runnerRunBtn}
                                                    onClick={() => runRequest(req)}
                                                    disabled={state.loading}
                                                    title="Run request"
                                                >
                                                    {state.loading ? <BiRefresh className={styles.spinning} /> : <BiSend />}
                                                </button>
                                            </div>

                                            <div className={styles.runnerReqUrl}>{req.urlTemplate}</div>

                                            {(req.params?.length ?? 0) > 0 && (
                                                <div className={styles.runnerParams}>
                                                    {(req.params ?? []).map((p) => (
                                                        <input
                                                            key={p.key}
                                                            className={styles.runnerParamInput}
                                                            value={state.paramValues[p.key] ?? ""}
                                                            onChange={(e) => updateParam(req.id, p.key, e.target.value)}
                                                            onKeyDown={(e) => e.key === "Enter" && runRequest(req)}
                                                            placeholder={p.placeholder}
                                                            spellCheck={false}
                                                        />
                                                    ))}
                                                </div>
                                            )}

                                            {state.respExpanded && state.error && (
                                                <pre className={`${styles.runnerResponse} ${styles.runnerResponseError}`}>
                                                    {state.error}
                                                </pre>
                                            )}

                                            {state.respExpanded && state.response && (
                                                <>
                                                    <div className={styles.runnerStatusLine}>
                                                        <StatusBadge status={state.response.status} />
                                                    </div>
                                                    <pre className={styles.runnerResponse}>
                                                        {typeof state.response.body === "string"
                                                            ? state.response.body
                                                            : JSON.stringify(state.response.body, null, 2)}
                                                    </pre>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ── Request Panel ─────────────────────────────────────────────────────────────

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

function RequestPanel() {
    const { sessionToken } = useUserDashboardStore();
    const [method,    setMethod]    = useState("GET");
    const [url,       setUrl]       = useState("");
    const [bodyText,  setBodyText]  = useState("");
    const [response,  setResponse]  = useState<{ status: number; body: unknown } | null>(null);
    const [error,     setError]     = useState<string | null>(null);
    const [sending,   setSending]   = useState(false);

    const send = async () => {
        if (!url.trim()) return;
        setSending(true);
        setResponse(null);
        setError(null);
        try {
            let parsedBody: unknown = undefined;
            if (bodyText.trim()) {
                try { parsedBody = JSON.parse(bodyText); }
                catch { setError("Body is not valid JSON"); setSending(false); return; }
            }
            const res = await fetch("/api/dev-proxy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: url.trim(), method, body: parsedBody, token: sessionToken }),
            });
            const data = await res.json();
            if (data.error) { setError(data.error); }
            else { setResponse({ status: data.status, body: data.body }); }
        } catch (e) {
            setError(String(e));
        } finally {
            setSending(false);
        }
    };

    const statusColor = response
        ? response.status < 300 ? "#22c55e" : response.status < 400 ? "#f59e0b" : "#ef4444"
        : "#6b7280";

    return (
        <div className={styles.reqPanel}>
            {/* Method + URL */}
            <div className={styles.reqRow}>
                <select
                    className={styles.reqMethod}
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    style={{ color: METHOD_COLORS[method] ?? "#a855f7" }}
                >
                    {METHODS.map((m) => (
                        <option key={m} value={m} style={{ color: METHOD_COLORS[m] ?? "#a855f7" }}>{m}</option>
                    ))}
                </select>
                <input
                    className={styles.reqUrl}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder="https://api.example.com/endpoint"
                    spellCheck={false}
                />
                <button className={styles.reqSendBtn} onClick={send} disabled={sending || !url.trim()} title="Send">
                    <BiSend />
                </button>
            </div>

            {/* Auth badge */}
            <div className={styles.reqAuthRow}>
                <span className={styles.reqAuthBadge} style={{ color: sessionToken ? "#22c55e" : "#6b7280" }}>
                    {sessionToken ? "● Bearer token attached" : "○ No session token"}
                </span>
                <span className={styles.reqAuthBadge} style={{ color: "#3b82f6" }}>● API key attached</span>
            </div>

            {/* Body */}
            {method !== "GET" && method !== "DELETE" && (
                <textarea
                    className={styles.reqBody}
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    placeholder={'{\n  "key": "value"\n}'}
                    spellCheck={false}
                />
            )}

            {/* Response */}
            {error && (
                <pre className={`${styles.reqResponse} ${styles.reqResponseError}`}>{error}</pre>
            )}
            {response && (
                <>
                    <div className={styles.reqStatusLine}>
                        <span style={{ color: statusColor, fontWeight: 600, fontSize: "9pt" }}>{response.status}</span>
                    </div>
                    <pre className={styles.reqResponse}>
                        {typeof response.body === "string"
                            ? response.body
                            : JSON.stringify(response.body, null, 2)}
                    </pre>
                </>
            )}
        </div>
    );
}

// ── Main console ──────────────────────────────────────────────────────────────

const MIN_WIDTH = 320;
const MAX_WIDTH_OFFSET = 80; // keep at least 80px of page visible

const DevConsole = () => {
    const { openPanel, close } = useSidebarStore();
    const isOpen = openPanel === "devConsole";
    const { logs, clearLogs, panelWidth, setPanelWidth } = useDevConsoleStore();

    const [mounted, setMounted] = useState(false);
    const [tab, setTab] = useState<"logs" | "request" | "routes">("logs");
    useEffect(() => { setMounted(true); }, []);

    const isDragging = useRef(false);
    const startX = useRef(0);
    const startWidth = useRef(panelWidth);

    const onMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging.current) return;
        const delta = startX.current - e.clientX;
        const maxWidth = window.innerWidth - MAX_WIDTH_OFFSET;
        const next = Math.min(maxWidth, Math.max(MIN_WIDTH, startWidth.current + delta));
        setPanelWidth(next);
    }, [setPanelWidth]);

    const onMouseUp = useCallback(() => {
        if (!isDragging.current) return;
        isDragging.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
    }, [onMouseMove]);

    const onHandleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isDragging.current = true;
        startX.current = e.clientX;
        startWidth.current = panelWidth;
        document.body.style.cursor = "ew-resize";
        document.body.style.userSelect = "none";
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    }, [panelWidth, onMouseMove, onMouseUp]);

    // Clean up listeners if component unmounts mid-drag
    useEffect(() => {
        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };
    }, [onMouseMove, onMouseUp]);

    return (
        <div
            className={`${styles.panel} ${isOpen ? styles.panelOpen : styles.panelClosed}`}
            style={mounted && window.innerWidth >= 768 ? { width: panelWidth } : undefined}
        >
            {/* Resize handle */}
            <div
                className={styles.resizeHandle}
                onMouseDown={onHandleMouseDown}
                title="Drag to resize"
            >
                <div className={styles.resizeGrip} />
            </div>

            {/* Header */}
            <div className={styles.headerRow}>
                <button onClick={close} className={styles.closeBtn}>
                    <IoClose />
                </button>
                <p className={styles.title}>Dev Console</p>
                <button
                    onClick={clearLogs}
                    className={styles.clearBtn}
                    title="Clear all logs"
                >
                    <BiTrash />
                </button>
            </div>

            {/* Tabs */}
            <div className={styles.tabBar}>
                <button className={`${styles.tab} ${tab === "logs" ? styles.tabActive : ""}`} onClick={() => setTab("logs")}>Logs</button>
                <button className={`${styles.tab} ${tab === "request" ? styles.tabActive : ""}`} onClick={() => setTab("request")}>Request</button>
                <button className={`${styles.tab} ${tab === "routes" ? styles.tabActive : ""}`} onClick={() => setTab("routes")}>Routes</button>
            </div>

            {tab === "logs" ? (
                <>
                    {/* Stats bar */}
                    <div className={styles.statsBar}>
                        <span className={styles.statItem}>
                            <span className={styles.statDot} style={{ background: "#22c55e" }} />
                            {logs.filter((l) => l.status !== null && l.status < 300).length} ok
                        </span>
                        <span className={styles.statItem}>
                            <span className={styles.statDot} style={{ background: "#ef4444" }} />
                            {logs.filter((l) => l.status === null || l.status >= 400).length} err
                        </span>
                        <span className={styles.statCount}>{logs.length} total</span>
                    </div>

                    {/* Log list */}
                    <div className={styles.logList}>
                        {logs.length === 0 ? (
                            <div className={styles.empty}>
                                <p className={styles.emptyText}>No requests logged yet.</p>
                                <p className={styles.emptyHint}>
                                    API calls will appear here as you use the app.
                                </p>
                            </div>
                        ) : (
                            logs.map((log) => <LogEntry key={log.id} log={log} />)
                        )}
                    </div>
                </>
            ) : tab === "request" ? (
                <RequestPanel />
            ) : (
                <RunnerPanel />
            )}
        </div>
    );
};

export default DevConsole;
