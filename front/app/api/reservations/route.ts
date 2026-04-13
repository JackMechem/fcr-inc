import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId is required." }, { status: 400 });

    const cookieStore = await cookies();
    const raw = cookieStore.get("credentials")?.value;
    const { username, password } = raw
        ? JSON.parse(raw)
        : { username: "jim", password: "intentionallyInsecurePassword#3" };
    const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;

    const res = await fetch(`${process.env.API_BASE_URL}/users/${userId}/reservations`, {
        headers: { "Authorization": authHeader },
        cache: "no-store",
    });

    if (!res.ok) return NextResponse.json({ error: "Failed to fetch reservations." }, { status: res.status });

    const reservations = await res.json();

    // Enrich each reservation with car details
    const enriched = await Promise.all(
        reservations.map(async (r: { carVin: string; [key: string]: unknown }) => {
            try {
                const carRes = await fetch(`${process.env.API_BASE_URL}/cars/${r.carVin}`, {
                    headers: { "Authorization": authHeader },
                });
                const car = carRes.ok ? await carRes.json() : null;
                return { ...r, car };
            } catch {
                return { ...r, car: null };
            }
        })
    );

    return NextResponse.json(enriched);
}
