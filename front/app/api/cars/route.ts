import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

async function getAuthHeader() {
    const cookieStore = await cookies();
    const raw = cookieStore.get("credentials")?.value;
    const { username, password } = raw
        ? JSON.parse(raw)
        : { username: "jim", password: "intentionallyInsecurePassword#3" };
    return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

export async function GET(req: NextRequest) {
    const authHeader = await getAuthHeader();
    const qs = req.nextUrl.searchParams.toString();

    const res = await fetch(`${process.env.API_BASE_URL}/cars?${qs}`, {
        headers: { Authorization: authHeader },
        cache: "no-store",
    });
    return NextResponse.json(await res.json(), { status: res.status });
}

export async function POST(req: NextRequest) {
    const authHeader = await getAuthHeader();
    const body = await req.json();

    const res = await fetch(`${process.env.API_BASE_URL}/cars`, {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    const text = await res.text();
    return new NextResponse(text, { status: res.status });
}
