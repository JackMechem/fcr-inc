import { NextResponse } from "next/server";

export async function GET() {
    const res = await fetch(`${process.env.API_BASE_URL}/enums`, { cache: "no-store" });
    return NextResponse.json(await res.json(), { status: res.status });
}
