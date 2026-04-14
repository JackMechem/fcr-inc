import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const cookieStore = await cookies();
    const raw = cookieStore.get("credentials")?.value;
    const { username, password } = raw
        ? JSON.parse(raw)
        : { username: "jim", password: "intentionallyInsecurePassword#3" };
    const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;

    const body = await req.json();

    const res = await fetch(`${process.env.API_BASE_URL}/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": authHeader },
        body: JSON.stringify(body),
    });

    try {
        return NextResponse.json(await res.json());
    } catch {
        return NextResponse.json(null);
    }
}
