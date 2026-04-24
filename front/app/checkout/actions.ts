"use server";

import { serverApi } from "@/app/lib/fcr-client/server";
import { getSessionCookies } from "@/app/lib/serverAuth";

// ── Server-side (called from checkout/page.tsx) ───────────────────────────────

export async function getCheckoutData() {
    const { sessionToken, stripeUserId } = await getSessionCookies();
    const isAuthenticated = !!sessionToken;
    if (!sessionToken || !stripeUserId) return { isAuthenticated, initialUser: null };
    const initialUser = await serverApi.users.getById(stripeUserId, sessionToken) as Record<string, unknown> | null;
    return { isAuthenticated, initialUser };
}
