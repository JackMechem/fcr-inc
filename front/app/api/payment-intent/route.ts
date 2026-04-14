import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
    const headers = { "Content-Type": "application/json" };

    const { userInfo, cars } = await req.json();

    // Step 1: find or create Stripe user
    const userRes = await fetch(`${process.env.API_BASE_URL}/stripe/user`, {
        method: "POST",
        headers,
        body: JSON.stringify(userInfo),
    });
    if (!userRes.ok) {
        return NextResponse.json({ error: "Failed to create user." }, { status: userRes.status });
    }
    const { userId } = await userRes.json();

    // Step 2: create payment intent
    const intentRes = await fetch(`${process.env.API_BASE_URL}/stripe/payment-intent`, {
        method: "POST",
        headers,
        body: JSON.stringify({
            userId,
            driversLicense: userInfo.driversLicense.driversLicense,
            cars,
        }),
    });
    if (!intentRes.ok) {
        return NextResponse.json({ error: "Failed to initiate payment." }, { status: intentRes.status });
    }
    const { clientSecret } = await intentRes.json();

    return NextResponse.json({
        clientSecret,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
}
