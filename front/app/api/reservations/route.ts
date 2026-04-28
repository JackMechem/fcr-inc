import { NextRequest, NextResponse } from "next/server";
import { getBearerHeader, getApiKeyHeader } from "@/app/lib/serverAuth";

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const pageSize = searchParams.get("pageSize") ?? "25";
    const page     = searchParams.get("page")     ?? "1";
    const authHeader = await getBearerHeader();

    // Forward supported filter/sort params to the backend
    const forward = [
        "user", "sortBy", "sortDir", "car", "parseFullObjects",
        "minPickUpTime", "maxPickUpTime", "minDropOffTime", "maxDropOffTime",
    ];
    const params = new URLSearchParams({ pageSize, page });
    for (const key of forward) {
        const val = searchParams.get(key);
        if (val !== null) params.set(key, val);
    }

    const backendUrl = `${process.env.API_BASE_URL}/reservations?${params}`;
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
