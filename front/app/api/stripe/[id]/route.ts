import { NextRequest, NextResponse } from "next/server";
import { getBearerHeader, getApiKeyHeader } from "@/app/lib/serverAuth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const authHeader = await getBearerHeader();
    const headers: HeadersInit = {
        ...getApiKeyHeader(),
        ...(authHeader ? { Authorization: authHeader } : {}),
    };
    const res = await fetch(`${process.env.API_BASE_URL}/stripe/${encodeURIComponent(id)}`, {
        headers,
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
    });
    const text = await res.text();
    return new NextResponse(text, { status: res.status });
}
