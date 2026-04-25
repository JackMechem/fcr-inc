import { NextRequest, NextResponse } from "next/server";
import { getBearerHeader, getApiKeyHeader } from "@/app/lib/serverAuth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ table: string }> }) {
    const { table } = await params;
    const authHeader = await getBearerHeader();
    const headers: HeadersInit = { ...getApiKeyHeader(), ...(authHeader ? { Authorization: authHeader } : {}) };
    const res = await fetch(`${process.env.API_BASE_URL}/table-config/${table}`, { headers, cache: "no-store" });
    return NextResponse.json(await res.json(), { status: res.status });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ table: string }> }) {
    const { table } = await params;
    const authHeader = await getBearerHeader();
    const body = await req.json();
    const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...getApiKeyHeader(),
        ...(authHeader ? { Authorization: authHeader } : {}),
    };
    const res = await fetch(`${process.env.API_BASE_URL}/table-config/${table}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) return new NextResponse(text, { status: res.status });
    try {
        return NextResponse.json(JSON.parse(text), { status: res.status });
    } catch {
        return new NextResponse(text, { status: res.status });
    }
}
