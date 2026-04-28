import { NextRequest, NextResponse } from "next/server";
import { getBearerHeader, getApiKeyHeader } from "@/app/lib/serverAuth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const authHeader = await getBearerHeader();

    const url = `${process.env.API_BASE_URL}/accounts/${id}?parseFullObjects=true`;
    const headers: HeadersInit = { ...getApiKeyHeader(), ...(authHeader ? { Authorization: authHeader } : {}) };
    const res = await fetch(url, { headers, cache: "no-store" });
    if (!res.ok) {
        const text = await res.text();
        return new NextResponse(text, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(
        { cartReservations: data.cartReservations ?? [] },
        { headers: { "X-Backend-Url": url } },
    );
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const body = await req.json();
    const authHeader = await getBearerHeader();

    const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...getApiKeyHeader(),
        ...(authHeader ? { Authorization: authHeader } : {}),
    };

    const res = await fetch(`${process.env.API_BASE_URL}/accounts/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ cartReservations: body.cartReservations ?? [] }),
    });

    const responseText = await res.text();
    console.log(`[cart] PATCH /accounts/${id} — status: ${res.status}, body: ${responseText}`);

    const backendUrl = `${process.env.API_BASE_URL}/accounts/${id}`;
    if (res.ok || res.status === 201 || res.status === 204) {
        return new NextResponse(null, { status: 204, headers: { "X-Backend-Url": backendUrl } });
    }
    return new NextResponse(responseText, { status: res.status, headers: { "X-Backend-Url": backendUrl } });
}
