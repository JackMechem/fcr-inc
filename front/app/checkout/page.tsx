"use client";

import { useState } from "react";
import Image from "next/image";
import NavHeader from "../components/headers/navHeader";
import MainBodyContainer from "../components/containers/mainBodyContainer";
import { useCartStore } from "@/stores/cartStore";
import { CartProps } from "../types/CartTypes";
import { BiCar, BiCalendar, BiTrash, BiCreditCard, BiLock, BiUser, BiPhone, BiEnvelope, BiIdCard } from "react-icons/bi";

// ── Helpers ───────────────────────────────────────────────────────────────────

const daysBetween = (start?: string, end?: string): number => {
    if (!start || !end) return 1;
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 1;
};

const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

const inputCls = "w-full bg-primary border border-third rounded-xl px-[14px] py-[11px] text-[10.5pt] text-foreground placeholder:text-foreground-light/60 focus:outline-none focus:border-accent/60 transition";
const labelCls = "block text-[8pt] font-[600] uppercase tracking-wider text-foreground-light mb-[6px]";

// ── Cart item row ─────────────────────────────────────────────────────────────

const CartItemRow = ({ item, onRemove }: { item: CartProps; onRemove: () => void }) => {
    const days = daysBetween(item.startDate, item.endDate);
    const subtotal = item.pricePerDay * days;

    return (
        <div className="flex gap-[16px] py-[20px] border-b border-third/40 last:border-0">
            {/* Image */}
            <div className="relative flex-shrink-0 w-[100px] h-[68px] rounded-xl overflow-hidden bg-third/30 border border-third/40">
                {item.image ? (
                    <Image src={item.image} alt={`${item.make} ${item.model}`} fill className="object-cover" sizes="100px"
                        onError={(e) => (e.currentTarget.style.display = "none")} />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-foreground-light/30">
                        <BiCar className="text-[26pt]" />
                    </div>
                )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-[8px]">
                    <div>
                        <p className="text-foreground text-[11pt] font-[600]">{item.make} {item.model}</p>
                        <p className="text-foreground-light text-[9pt] mt-[2px]">{item.vin}</p>
                    </div>
                    <button
                        onClick={onRemove}
                        className="flex-shrink-0 text-foreground-light/40 hover:text-red-400 transition-colors cursor-pointer mt-[2px]"
                    >
                        <BiTrash className="text-[14pt]" />
                    </button>
                </div>

                <div className="flex items-center gap-[6px] mt-[10px] text-foreground-light text-[9.5pt]">
                    <BiCalendar className="text-[11pt] flex-shrink-0" />
                    <span>{fmtDate(item.startDate)} — {fmtDate(item.endDate)}</span>
                    <span className="text-third">·</span>
                    <span>{days} day{days !== 1 ? "s" : ""}</span>
                </div>

                <div className="flex items-center justify-between mt-[8px]">
                    <p className="text-foreground-light text-[9.5pt]">${item.pricePerDay}/day</p>
                    <p className="text-foreground text-[11pt] font-[600]">${subtotal.toLocaleString()}</p>
                </div>
            </div>
        </div>
    );
};

// ── Section card ──────────────────────────────────────────────────────────────

const SectionCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="bg-primary border border-third/60 rounded-2xl p-[24px] flex flex-col gap-[20px]">
        <div className="flex items-center gap-[10px] pb-[4px] border-b border-third/40">
            <span className="text-accent text-[16pt]">{icon}</span>
            <p className="text-foreground text-[12pt] font-[600]">{title}</p>
        </div>
        {children}
    </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
        <label className={labelCls}>{label}</label>
        {children}
    </div>
);

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
    const { carData, removeCar } = useCartStore();

    const [form, setForm] = useState({
        firstName: "", lastName: "", email: "", phone: "", license: "",
        cardName: "", cardNumber: "", expiry: "", cvv: "",
    });

    const set = (key: keyof typeof form, value: string) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const formatCard = (val: string) =>
        val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

    const formatExpiry = (val: string) => {
        const digits = val.replace(/\D/g, "").slice(0, 4);
        return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    };

    const subtotals = carData.map((item) => item.pricePerDay * daysBetween(item.startDate, item.endDate));
    const subtotal = subtotals.reduce((a, b) => a + b, 0);
    const tax = Math.round(subtotal * 0.08);
    const total = subtotal + tax;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // placeholder — no action yet
    };

    return (
        <>
            <NavHeader white={false} />
            <div className="pt-[80px]">
                <MainBodyContainer>
                    <div className="py-[40px]">
                        <h1 className="text-foreground text-[24pt] font-[700] mb-[8px]">Checkout</h1>
                        <p className="text-foreground-light text-[11pt] mb-[36px]">
                            {carData.length} vehicle{carData.length !== 1 ? "s" : ""} in your reservation
                        </p>

                        {carData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-[80px] text-foreground-light gap-[12px]">
                                <BiCar className="text-[48pt] opacity-20" />
                                <p className="text-[13pt]">Your cart is empty.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-[24px] items-start">

                                    {/* ── Left column ── */}
                                    <div className="flex flex-col gap-[20px]">

                                        {/* Cart items */}
                                        <SectionCard title="Your Vehicles" icon={<BiCar />}>
                                            <div className="flex flex-col">
                                                {carData.map((item) => (
                                                    <CartItemRow
                                                        key={item.vin}
                                                        item={item}
                                                        onRemove={() => removeCar(item.vin)}
                                                    />
                                                ))}
                                            </div>
                                        </SectionCard>

                                        {/* Personal details */}
                                        <SectionCard title="Your Details" icon={<BiUser />}>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px]">
                                                <Field label="First Name">
                                                    <input className={inputCls} placeholder="John" value={form.firstName}
                                                        onChange={(e) => set("firstName", e.target.value)} required />
                                                </Field>
                                                <Field label="Last Name">
                                                    <input className={inputCls} placeholder="Doe" value={form.lastName}
                                                        onChange={(e) => set("lastName", e.target.value)} required />
                                                </Field>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px]">
                                                <Field label="Email">
                                                    <div className="relative">
                                                        <BiEnvelope className="absolute left-[14px] top-1/2 -translate-y-1/2 text-foreground-light text-[13pt]" />
                                                        <input type="email" className={`${inputCls} pl-[40px]`} placeholder="john@example.com"
                                                            value={form.email} onChange={(e) => set("email", e.target.value)} required />
                                                    </div>
                                                </Field>
                                                <Field label="Phone">
                                                    <div className="relative">
                                                        <BiPhone className="absolute left-[14px] top-1/2 -translate-y-1/2 text-foreground-light text-[13pt]" />
                                                        <input type="tel" className={`${inputCls} pl-[40px]`} placeholder="+1 (555) 000-0000"
                                                            value={form.phone} onChange={(e) => set("phone", e.target.value)} required />
                                                    </div>
                                                </Field>
                                            </div>
                                            <Field label="Driver's Licence Number">
                                                <div className="relative">
                                                    <BiIdCard className="absolute left-[14px] top-1/2 -translate-y-1/2 text-foreground-light text-[14pt]" />
                                                    <input className={`${inputCls} pl-[40px]`} placeholder="e.g. D123-4567-8900"
                                                        value={form.license} onChange={(e) => set("license", e.target.value)} required />
                                                </div>
                                            </Field>
                                        </SectionCard>

                                        {/* Payment */}
                                        <SectionCard title="Payment" icon={<BiCreditCard />}>
                                            <Field label="Name on Card">
                                                <input className={inputCls} placeholder="John Doe" value={form.cardName}
                                                    onChange={(e) => set("cardName", e.target.value)} required />
                                            </Field>
                                            <Field label="Card Number">
                                                <div className="relative">
                                                    <BiCreditCard className="absolute left-[14px] top-1/2 -translate-y-1/2 text-foreground-light text-[13pt]" />
                                                    <input className={`${inputCls} pl-[40px] font-mono tracking-widest`}
                                                        placeholder="0000 0000 0000 0000"
                                                        value={form.cardNumber}
                                                        onChange={(e) => set("cardNumber", formatCard(e.target.value))}
                                                        maxLength={19} required />
                                                </div>
                                            </Field>
                                            <div className="grid grid-cols-2 gap-[14px]">
                                                <Field label="Expiry">
                                                    <input className={`${inputCls} font-mono`} placeholder="MM/YY"
                                                        value={form.expiry}
                                                        onChange={(e) => set("expiry", formatExpiry(e.target.value))}
                                                        maxLength={5} required />
                                                </Field>
                                                <Field label="CVV">
                                                    <input className={`${inputCls} font-mono`} placeholder="123"
                                                        value={form.cvv}
                                                        onChange={(e) => set("cvv", e.target.value.replace(/\D/g, "").slice(0, 4))}
                                                        maxLength={4} required />
                                                </Field>
                                            </div>
                                            <div className="flex items-center gap-[8px] text-foreground-light text-[9pt] pt-[4px]">
                                                <BiLock className="text-[12pt] flex-shrink-0" />
                                                <span>Your payment information is encrypted and secure.</span>
                                            </div>
                                        </SectionCard>
                                    </div>

                                    {/* ── Right column: Order summary ── */}
                                    <div className="lg:sticky lg:top-[90px] bg-primary border border-third/60 rounded-2xl p-[24px] flex flex-col gap-[20px]">
                                        <p className="text-foreground text-[12pt] font-[600] pb-[4px] border-b border-third/40">Order Summary</p>

                                        {/* Per-item breakdown */}
                                        <div className="flex flex-col gap-[10px]">
                                            {carData.map((item, i) => {
                                                const days = daysBetween(item.startDate, item.endDate);
                                                return (
                                                    <div key={item.vin} className="flex justify-between items-start gap-[8px]">
                                                        <div className="min-w-0">
                                                            <p className="text-foreground text-[10pt] font-[500] truncate">{item.make} {item.model}</p>
                                                            <p className="text-foreground-light text-[8.5pt]">{days}d × ${item.pricePerDay}/day</p>
                                                        </div>
                                                        <p className="text-foreground text-[10pt] font-[500] flex-shrink-0">${subtotals[i].toLocaleString()}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Totals */}
                                        <div className="flex flex-col gap-[8px] pt-[4px] border-t border-third/40">
                                            <div className="flex justify-between text-[10pt] text-foreground-light">
                                                <span>Subtotal</span>
                                                <span>${subtotal.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-[10pt] text-foreground-light">
                                                <span>Tax (8%)</span>
                                                <span>${tax.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-[12pt] font-[700] text-foreground pt-[6px] border-t border-third/40">
                                                <span>Total</span>
                                                <span className="text-accent">${total.toLocaleString()}</span>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            className="w-full py-[14px] bg-accent text-primary font-[600] text-[11pt] rounded-xl hover:brightness-110 transition cursor-pointer"
                                        >
                                            Confirm Reservation
                                        </button>

                                        <p className="text-foreground-light text-[8.5pt] text-center leading-[1.5]">
                                            By confirming, you agree to our terms of service and rental policy.
                                        </p>
                                    </div>

                                </div>
                            </form>
                        )}
                    </div>
                </MainBodyContainer>
            </div>
        </>
    );
}
