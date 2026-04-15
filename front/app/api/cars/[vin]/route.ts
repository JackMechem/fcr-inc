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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ vin: string }> }) {
    const { vin } = await params;
    const authHeader = await getAuthHeader();

    const res = await fetch(`${process.env.API_BASE_URL}/cars/${vin}`, {
        headers: { Authorization: authHeader },
        cache: "no-store",
    });
    return NextResponse.json(await res.json(), { status: res.status });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ vin: string }> }) {
    const { vin } = await params;
    const authHeader = await getAuthHeader();
    const body = await req.json();

    const res = await fetch(`${process.env.API_BASE_URL}/cars/${vin}`, {
        method: "PATCH",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    const text = await res.text();
    return new NextResponse(text, { status: res.status });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ vin: string }> }) {
    const { vin } = await params;
    const authHeader = await getAuthHeader();

    const res = await fetch(`${process.env.API_BASE_URL}/cars/${vin}`, {
        method: "DELETE",
        headers: { Authorization: authHeader },
    });
    const text = await res.text();
    return new NextResponse(text, { status: res.status });
}
