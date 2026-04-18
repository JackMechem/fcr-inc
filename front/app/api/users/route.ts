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
