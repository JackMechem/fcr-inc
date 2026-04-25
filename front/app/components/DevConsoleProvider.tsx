"use client";

import { useEffect } from "react";
import { useDevConsoleStore } from "@/stores/devConsoleStore";
import { useUserDashboardStore } from "@/stores/userDashboardStore";

const BACKEND_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

function toBackendUrl(nextUrl: string): string {
    // /api/cars?foo=1  →  http://localhost:8080/cars?foo=1
    const withoutPrefix = nextUrl.replace(/^\/api/, "");
    return `${BACKEND_BASE}${withoutPrefix}`;
}

const DevConsoleProvider = () => {
    const role = useUserDashboardStore((s) => s.role);

    useEffect(() => {
        if (role !== "ADMIN") return;

        const originalFetch = window.fetch.bind(window);

        window.fetch = async function devConsoleFetch(input, init) {
            const url =
                typeof input === "string"
                    ? input
                    : input instanceof URL
                        ? input.toString()
                        : (input as Request).url;

            // Only intercept /api/ proxy routes
            if (!url.startsWith("/api/")) {
                return originalFetch(input, init);
            }

            const backendUrl = toBackendUrl(url);

            const method = (
                init?.method ??
                (input instanceof Request ? input.method : "GET")
            ).toUpperCase();

            let requestBody: unknown = undefined;
            if (init?.body != null) {
                try {
                    requestBody = JSON.parse(init.body as string);
                } catch {
                    requestBody = init.body;
                }
            } else if (input instanceof Request && init?.body === undefined) {
                try {
                    requestBody = await input.clone().json();
                } catch {
                    // no body or non-JSON
                }
            }

            const startTime = performance.now();

            try {
                const response = await originalFetch(input, init);
                const duration = Math.round(performance.now() - startTime);
                const cloned = response.clone();

                let responseBody: unknown;
                try {
                    responseBody = await cloned.json();
                } catch {
                    try {
                        responseBody = await cloned.text();
                    } catch {
                        responseBody = "(unreadable)";
                    }
                }

                useDevConsoleStore.getState().addLog({
                    id: crypto.randomUUID(),
                    method,
                    url,
                    backendUrl,
                    status: response.status,
                    requestBody,
                    responseBody,
                    timestamp: new Date(),
                    duration,
                });

                return response;
            } catch (err) {
                const duration = Math.round(performance.now() - startTime);
                useDevConsoleStore.getState().addLog({
                    id: crypto.randomUUID(),
                    method,
                    url,
                    backendUrl,
                    status: null,
                    requestBody,
                    responseBody: null,
                    timestamp: new Date(),
                    duration,
                    error: err instanceof Error ? err.message : String(err),
                });
                throw err;
            }
        };

        return () => {
            window.fetch = originalFetch;
        };
    }, [role]);

    return null;
};

export default DevConsoleProvider;
