import { NextRequest, NextResponse } from "next/server";
import { getBearerHeader, getApiKeyHeader } from "@/app/lib/serverAuth";

export async function GET(req: NextRequest) {
    const userId = req.nextUrl.searchParams.get("userId");
    const pageSize = req.nextUrl.searchParams.get("pageSize") ?? "500";
    const page = req.nextUrl.searchParams.get("page") ?? "1";
    const authHeader = await getBearerHeader();

    const backendUrl = `${process.env.API_BASE_URL}/reservations?pageSize=${pageSize}&page=${page}`;
    console.log("[GET /api/reservations] →", backendUrl);

    const headers: HeadersInit = { ...getApiKeyHeader(), ...(authHeader ? { Authorization: authHeader } : {}) };

    let res: Response;
    try {
        res = await fetch(backendUrl, { headers, cache: "no-store", signal: AbortSignal.timeout(30000) });
    } catch (err) {
        console.error("[GET /api/reservations] fetch threw:", err);
        return NextResponse.json({ error: "Request to backend timed out or failed" }, { status: 502 });
    }

    if (!res.ok) {
        const body = await res.text();
        console.error(`[GET /api/reservations] backend returned ${res.status}:`, body);
        return NextResponse.json({ error: body }, { status: res.status });
    }

    const result = await res.json();
    console.log(`[GET /api/reservations] backend ok — totalItems: ${result.totalItems ?? "?"}`);

    const all: Record<string, unknown>[] = Array.isArray(result) ? result : (result.data ?? []);

    if (userId) {
        const uid = Number(userId);
        const filtered = all.filter((r) => {
            const u = r.user;
            return typeof u === "object" && u !== null
                ? (u as Record<string, unknown>).userId === uid
                : u === uid;
        });
        return NextResponse.json(filtered);
    }

    return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
    const authHeader = await getBearerHeader();
    const body = await req.json();
    const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...getApiKeyHeader(),
        ...(authHeader ? { Authorization: authHeader } : {}),
    };
    try {
        const res = await fetch(`${process.env.API_BASE_URL}/reservations`, {
            method: "POST",
            headers,
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(8000),
        });
        const text = await res.text();
        return new NextResponse(text, { status: res.status });
    } catch (err) {
        console.error("[POST /api/reservations] error:", err);
        return NextResponse.json({ error: "Failed to create reservation" }, { status: 502 });
    }
}
