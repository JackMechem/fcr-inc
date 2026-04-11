"use client";

import { Suspense } from "react";
import { useSidebarStore } from "@/stores/sidebarStore";
import HeaderMenu from "./menus/headerMenu";
import FilterSidebar from "./menus/filterSidebar";
import { useWindowSize } from "@/app/hooks/useWindowSize";

const SidebarLayout = ({ children }: { children: React.ReactNode }) => {
    const { openPanel } = useSidebarStore();
    const { width } = useWindowSize();
    const pushContent = openPanel && (width === undefined || width >= 1110);

    return (
        <div className="flex min-h-full">
            <div
                className="flex-1 min-w-0 transition-all duration-300 ease-in-out"
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
