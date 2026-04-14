import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
    const email = req.nextUrl.searchParams.get("email");
    if (!email) return NextResponse.json(null);

    const cookieStore = await cookies();
    const raw = cookieStore.get("credentials")?.value;
    const { username, password } = raw
        ? JSON.parse(raw)
        : { username: "jim", password: "intentionallyInsecurePassword#3" };
    const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;

    try {
        const res = await fetch(
            `${process.env.API_BASE_URL}/users?email=${encodeURIComponent(email)}`,
            { headers: { "Authorization": authHeader }, cache: "no-store" }
        );
        return NextResponse.json(await res.json());
    } catch {
        return NextResponse.json(null);
    }
}
