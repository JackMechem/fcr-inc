"use client";

import { Suspense } from "react";
import { useSidebarStore } from "@/stores/sidebarStore";
import HeaderMenu from "./menus/headerMenu";
import FilterSidebar from "./menus/filterSidebar";

const SidebarLayout = ({ children }: { children: React.ReactNode }) => {
    const { openPanel } = useSidebarStore();

    return (
        <div className="flex min-h-full">
            <div
                className={`flex-1 min-w-0 transition-all duration-300 ease-in-out ${openPanel ? "md:mr-[380px]" : "mr-0"}`}
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
