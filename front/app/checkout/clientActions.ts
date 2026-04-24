import { browserApi } from "@/app/lib/fcr-client";

// ── Client-side (called from CheckoutClient.tsx) ──────────────────────────────

export const lookupUserByEmail = (email: string) =>
    browserApi.auth.userLookup(email);

export const checkAccountExists = (email: string) =>
    browserApi.auth.checkAccount(email);

export const createPaymentIntent = (data: {
    userInfo: Record<string, unknown> | null;
    cars: { vin: string; pickUpTime: string; dropOffTime: string }[];
}) => browserApi.payment.createIntent(data);
