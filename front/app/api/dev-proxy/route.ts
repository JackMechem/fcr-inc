import { NextRequest, NextResponse } from "next/server";
import { getApiKeyHeader } from "@/app/lib/serverAuth";

export async function POST(req: NextRequest) {
    const { url, method, body, token } = await req.json();

    if (!url) return NextResponse.json({ error: "url is required" }, { status: 400 });

    const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...getApiKeyHeader(),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    try {
        const res = await fetch(url, {
            method: method ?? "GET",
            headers,
            body: body ? JSON.stringify(body) : undefined,
            signal: AbortSignal.timeout(15000),
        });

        let responseBody: unknown;
        const contentType = res.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
            responseBody = await res.json();
        } else {
            responseBody = await res.text();
        }

        return NextResponse.json({ status: res.status, body: responseBody });
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 502 });
    }
}
