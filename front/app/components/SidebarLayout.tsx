"use client";

import { Suspense, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSidebarStore } from "@/stores/sidebarStore";
import HeaderMenu from "./menus/headerMenu";
import FilterSidebar from "./menus/filterSidebar";
import { useWindowSize } from "@/app/hooks/useWindowSize";
import styles from "./SidebarLayout.module.css";

const SidebarLayout = ({ children }: { children: React.ReactNode }) => {
    const pathname = usePathname();
    useEffect(() => {
        if (pathname !== "/login") {
            sessionStorage.setItem("pre-login-path", pathname);
        }
    }, [pathname]);

    const { openPanel } = useSidebarStore();
    const { width } = useWindowSize();
    const pushContent = openPanel && (width === undefined || width >= 1110);

    return (
        <div className={styles.root}>
            <div
                className={styles.content}
                style={{ marginRight: pushContent ? 380 : 0 }}
            >
                {children}
            </div>
            <HeaderMenu />
            <Suspense>
                <FilterSidebar />
            </Suspense>
        </div>
    );
};

export default SidebarLayout;
