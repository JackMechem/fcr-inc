import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
    const cookieStore = await cookies();
    const raw = cookieStore.get("credentials")?.value;
    const { username, password } = raw
        ? JSON.parse(raw)
        : { username: "jim", password: "intentionallyInsecurePassword#3" };
    const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;

    const params = new URLSearchParams(req.nextUrl.searchParams);
    params.set("parseFullObjects", "true");

    const userId = params.get("userId");

    const res = await fetch(
        `${process.env.API_BASE_URL}/reservations?${params.toString()}`,
        { headers: { "Authorization": authHeader }, cache: "no-store" }
    );

    const result = await res.json();

    if (userId) {
        // User dashboard: return flat array
        const reservations = Array.isArray(result) ? result : (result.data ?? []);
        return NextResponse.json(reservations);
    }

    // Admin: return full paginated response
    return NextResponse.json(result);
}
