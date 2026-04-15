import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get("Authorization");

    const res = await fetch(`${process.env.API_BASE_URL}/auth/validate`, {
        headers: {
            Authorization: authHeader ?? "",
            "Content-Type": "application/json",
        },
        cache: "no-store",
    });

    return new NextResponse(null, { status: res.status });
}
