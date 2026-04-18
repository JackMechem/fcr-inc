import { NextRequest, NextResponse } from "next/server";
import { getBearerHeader, getApiKeyHeader } from "@/app/lib/serverAuth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const authHeader = await getBearerHeader();

    const qs = req.nextUrl.searchParams.toString();
    const url = `${process.env.API_BASE_URL}/accounts/${id}${qs ? `?${qs}` : ""}`;

    const headers: HeadersInit = { ...getApiKeyHeader(), ...(authHeader ? { Authorization: authHeader } : {}) };
    const res = await fetch(url, { headers, cache: "no-store" });
    return NextResponse.json(await res.json(), { status: res.status });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const authHeader = await getBearerHeader();
    const body = await req.json();

    const headers: HeadersInit = { "Content-Type": "application/json", ...getApiKeyHeader() };
    if (authHeader) headers["Authorization"] = authHeader;

    const res = await fetch(`${process.env.API_BASE_URL}/accounts/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(body),
    });
    if (res.status === 204) return new NextResponse(null, { status: 204 });
    const text = await res.text();
    return new NextResponse(text, { status: res.status });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const authHeader = await getBearerHeader();

    const headers: HeadersInit = { ...getApiKeyHeader(), ...(authHeader ? { Authorization: authHeader } : {}) };
    const res = await fetch(`${process.env.API_BASE_URL}/accounts/${id}`, {
        method: "DELETE",
        headers,
    });
    if (res.status === 204) return new NextResponse(null, { status: 204 });
    const text = await res.text();
    return new NextResponse(text, { status: res.status });
}
