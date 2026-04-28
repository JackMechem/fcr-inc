import { NextRequest, NextResponse } from "next/server";
import { getBearerHeader, getApiKeyHeader } from "@/app/lib/serverAuth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { searchParams } = req.nextUrl;
    const authHeader = await getBearerHeader();

    const forward = ["page", "pageSize", "sortBy", "sortDir"];
    const qp = new URLSearchParams();
    for (const key of forward) {
        const val = searchParams.get(key);
        if (val !== null) qp.set(key, val);
    }

    const backendUrl = `${process.env.API_BASE_URL}/users/${id}/payments?${qp}`;
    console.log("[GET /api/users/[id]/payments] →", backendUrl);

    const headers: HeadersInit = { ...getApiKeyHeader(), ...(authHeader ? { Authorization: authHeader } : {}) };

    try {
        const res = await fetch(backendUrl, { headers, cache: "no-store", signal: AbortSignal.timeout(15000) });
        if (!res.ok) {
            const body = await res.text();
            return NextResponse.json({ error: body }, { status: res.status });
        }
        return NextResponse.json(await res.json());
    } catch (err) {
        console.error("[GET /api/users/[id]/payments] error:", err);
        return NextResponse.json({ error: "Request failed" }, { status: 502 });
    }
}
