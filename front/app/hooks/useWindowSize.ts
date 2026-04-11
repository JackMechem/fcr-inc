"use client";

import { useState, useEffect } from "react";

export const useWindowSize = () => {
    const [width, setWidth] = useState<number | undefined>(
        typeof window !== "undefined" ? window.innerWidth : undefined
    );

    useEffect(() => {
        const handler = () => setWidth(window.innerWidth);
        window.addEventListener("resize", handler);
        return () => window.removeEventListener("resize", handler);
    }, []);

    return { width };
};
