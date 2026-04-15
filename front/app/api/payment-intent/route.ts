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
    const userBody = await userRes.json();
    console.log("[payment-intent] /stripe/user response:", JSON.stringify(userBody));
    const rawUser = userBody?.userId ?? userBody?.user ?? userBody?.id;
    const userId = typeof rawUser === "object" && rawUser !== null ? (rawUser.userId ?? rawUser.id) : rawUser;

    const intentPayload = {
        userId,
        driversLicense: userInfo.driversLicense.driversLicense,
        cars,
    };
    console.log("[payment-intent] /stripe/payment-intent payload:", JSON.stringify(intentPayload));

    // Step 2: create payment intent
    const intentRes = await fetch(`${process.env.API_BASE_URL}/stripe/payment-intent`, {
        method: "POST",
        headers,
        body: JSON.stringify(intentPayload),
    });
    if (!intentRes.ok) {
        const errBody = await intentRes.text();
        console.error("[payment-intent] /stripe/payment-intent failed:", intentRes.status, errBody);
        return NextResponse.json({ error: `Failed to initiate payment: ${errBody}` }, { status: intentRes.status });
    }
    const { clientSecret } = await intentRes.json();

    return NextResponse.json({
        clientSecret,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
}
