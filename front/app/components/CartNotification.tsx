"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useCartStore } from "@/stores/cartStore";

const CartNotification = () => {
    const { notification, clearNotification } = useCartStore();

    useEffect(() => {
        if (!notification) return;
        const timer = setTimeout(clearNotification, 5000);
        return () => clearTimeout(timer);
    }, [notification]);

    if (!notification) return null;

    return (
        <div
            className="fixed top-[90px] right-[24px] z-[100] w-[300px] flex flex-col gap-[4px] animate-in fade-in slide-in-from-bottom-4 duration-200"
            onClick={clearNotification}
        >
            <div className="w-full flex gap-[10px] text-[12pt] border border-third rounded-xl bg-primary shadow-lg cursor-pointer">
                {notification.image && (
                    <Image
                        src={notification.image}
                        alt="Car Photo"
                        width={100}
                        height={100}
                        className="h-[80px] w-[80px] object-cover rounded-l-lg flex-shrink-0"
                    />
                )}
                <div className="flex flex-col justify-between py-[5px]">
                    <p className="text-foreground text-[12pt]">
                        {notification.make} {notification.model}
                    </p>
                    <h3 className="text-accent text-[14pt]">
                        ${notification.pricePerDay}
                        <span className="opacity-[0.5] text-[10pt]">/day</span>
                    </h3>
                </div>
            </div>
        </div>
    );
};

export default CartNotification;
