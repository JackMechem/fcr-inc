import { NextRequest, NextResponse } from "next/server";
import { getBearerHeader, getApiKeyHeader } from "@/app/lib/serverAuth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const authHeader = await getBearerHeader();

    const headers: HeadersInit = { ...getApiKeyHeader(), ...(authHeader ? { Authorization: authHeader } : {}) };
    const res = await fetch(`${process.env.API_BASE_URL}/users/${id}`, {
        headers,
        cache: "no-store",
    });

    try {
        return NextResponse.json(await res.json());
    } catch {
        return NextResponse.json(null);
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const authHeader = await getBearerHeader();
    const body = await req.json();

    const headers: HeadersInit = { "Content-Type": "application/json", ...getApiKeyHeader() };
    if (authHeader) headers["Authorization"] = authHeader;

    const res = await fetch(`${process.env.API_BASE_URL}/users/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
    });

    try {
        return NextResponse.json(await res.json());
    } catch {
        return NextResponse.json(null);
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const authHeader = await getBearerHeader();

    const headers: HeadersInit = { ...getApiKeyHeader(), ...(authHeader ? { Authorization: authHeader } : {}) };
    const res = await fetch(`${process.env.API_BASE_URL}/users/${id}`, {
        method: "DELETE",
        headers,
    });
    if (res.status === 204) return new NextResponse(null, { status: 204 });
    const text = await res.text();
    return new NextResponse(text, { status: res.status });
}
