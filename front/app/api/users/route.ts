import { NextRequest, NextResponse } from "next/server";
import { getBearerHeader, getApiKeyHeader } from "@/app/lib/serverAuth";

export async function GET(req: NextRequest) {
    const authHeader = await getBearerHeader();
    const qs = req.nextUrl.searchParams.toString();

    const headers: HeadersInit = { ...getApiKeyHeader(), ...(authHeader ? { Authorization: authHeader } : {}) };
    const res = await fetch(`${process.env.API_BASE_URL}/users?${qs}`, {
        headers,
        cache: "no-store",
    });
    return NextResponse.json(await res.json(), { status: res.status });
}

export async function POST(req: NextRequest) {
    const authHeader = await getBearerHeader();
    const body = await req.json();
    const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...getApiKeyHeader(),
        ...(authHeader ? { Authorization: authHeader } : {}),
    };
    const res = await fetch(`${process.env.API_BASE_URL}/users`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8000),
    });
    const text = await res.text();
    return new NextResponse(text, { status: res.status });
}
