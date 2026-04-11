"use client";

import { useState } from "react";
import { useAdminSidebarStore, AdminView } from "@/stores/adminSidebarStore";
import { useWindowSize } from "@/app/hooks/useWindowSize";
import {
    BiCar, BiChevronLeft, BiChevronRight,
    BiPlus, BiEdit, BiTable, BiGridAlt, BiX, BiCalendar,
} from "react-icons/bi";

type Section = "cars" | "reservations";

interface SectionDef {
    id: Section;
    icon: React.ReactNode;
    label: string;
    items: { icon: React.ReactNode; label: string; view: AdminView }[];
}

const SECTIONS: SectionDef[] = [
    {
        id: "cars",
        icon: <BiCar />,
        label: "Cars",
        items: [
            { icon: <BiPlus />,  label: "Add Car",   view: "add-car"   },
            { icon: <BiEdit />,  label: "Edit Car",  view: "edit-car"  },
            { icon: <BiTable />, label: "View Data", view: "view-data" },
        ],
    },
    {
        id: "reservations",
        icon: <BiCalendar />,
        label: "Reservations",
        items: [
            { icon: <BiTable />, label: "View Data", view: "view-reservations" },
        ],
    },
];

// ── Mobile bottom bar + sheet ─────────────────────────────────────────────────

// ── Mobile bottom bar + sheet ─────────────────────────────────────────────────

const MobileSidebar = () => {
    const { activeView, setActiveView } = useAdminSidebarStore();
    const [sheetSection, setSheetSection] = useState<Section | null>(null);

    const handleDashboard = () => { setActiveView(null); setSheetSection(null); };
    const openSheet  = (id: Section) => setSheetSection(id);
    const closeSheet = () => setSheetSection(null);
    const pickView   = (view: AdminView) => { setActiveView(view); closeSheet(); };

    const sheet = SECTIONS.find((s) => s.id === sheetSection);

    return (
        <>
            {/* Bottom tab bar */}
            <div className="fixed bottom-0 left-0 right-0 z-20 bg-primary border-t border-third/50 flex items-center justify-around px-[8px] py-[6px]">
                <button
                    onClick={handleDashboard}
                    className={`flex flex-col items-center gap-[2px] px-[16px] py-[6px] rounded-xl cursor-pointer transition-colors ${
                        activeView === null && !sheetSection ? "text-accent" : "text-foreground-light"
                    }`}
                >
                    <BiGridAlt className="text-[20pt]" />
                    <span className="text-[7pt] font-[500]">Dashboard</span>
                </button>
                {SECTIONS.map((s) => {
                    const sectionActive = s.items.some((i) => i.view === activeView) || sheetSection === s.id;
                    return (
                        <button
                            key={s.id}
                            onClick={() => openSheet(s.id)}
                            className={`flex flex-col items-center gap-[2px] px-[16px] py-[6px] rounded-xl cursor-pointer transition-colors ${
                                sectionActive ? "text-accent" : "text-foreground-light"
                            }`}
                        >
                            <span className="text-[20pt]">{s.icon}</span>
                            <span className="text-[7pt] font-[500]">{s.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Bottom sheet */}
            {sheet && (
                <>
                    <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px]" onClick={closeSheet} />
                    <div className="fixed bottom-0 left-0 right-0 z-40 bg-primary rounded-t-2xl border-t border-third/40 shadow-xl animate-slide-up">
                        <div className="flex items-center justify-between px-[20px] pt-[16px] pb-[12px] border-b border-third/30">
                            <div className="flex items-center gap-[8px] text-foreground">
                                <span className="text-[18pt] text-accent">{sheet.icon}</span>
                                <span className="text-[13pt] font-[600]">{sheet.label}</span>
                            </div>
                            <button onClick={closeSheet} className="text-foreground-light text-[18pt] cursor-pointer hover:text-foreground transition-colors">
                                <BiX />
                            </button>
                        </div>
                        <div className="flex flex-col gap-[4px] px-[12px] py-[12px]">
                            {sheet.items.map((item) => {
                                const isActive = activeView === item.view;
                                return (
                                    <button
                                        key={String(item.view)}
                                        onClick={() => pickView(item.view)}
                                        className={`w-full flex items-center gap-[14px] px-[16px] py-[14px] rounded-xl cursor-pointer transition-colors text-left ${
                                            isActive ? "bg-accent/15 text-accent" : "hover:bg-third/20 text-foreground"
                                        }`}
                                    >
                                        <span className={`text-[18pt] flex-shrink-0 ${isActive ? "text-accent" : "text-foreground-light"}`}>
                                            {item.icon}
                                        </span>
                                        <span className="text-[12pt] font-[500]">{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="h-[16px]" />
                    </div>
                </>
            )}
        </>
    );
};

// ── Desktop left sidebar ──────────────────────────────────────────────────────

const DesktopSidebar = () => {
    const { collapsed, toggle, activeView, setActiveView } = useAdminSidebarStore();
    const [openSection, setOpenSection] = useState<Section | null>(
        () => SECTIONS.find((s) => s.items.some((i) => i.view === activeView))?.id ?? null
    );
    const [flyout, setFlyout] = useState<Section | null>(null);
    const flyoutTimer = useState<ReturnType<typeof setTimeout> | null>(null);

    const handleDashboard = () => { setActiveView(null); setOpenSection(null); };
    const handleSection   = (id: Section) => setOpenSection((prev) => (prev === id ? null : id));

    const activeSection = SECTIONS.find((s) => s.id === openSection);

    const openFlyout  = (id: Section) => {
        if (flyoutTimer[0]) clearTimeout(flyoutTimer[0]);
        setFlyout(id);
    };
    const closeFlyout = () => {
        flyoutTimer[0] = setTimeout(() => setFlyout(null), 120);
    };
    const keepFlyout  = () => {
        if (flyoutTimer[0]) clearTimeout(flyoutTimer[0]);
    };

    const flyoutSection = SECTIONS.find((s) => s.id === flyout);

    return (
        <div
            className={`fixed left-0 top-[70px] h-[calc(100vh-64px)] bg-primary border-r border-third/50 shadow-sm flex flex-col transition-all duration-300 ease-in-out z-[5] ${
                collapsed ? "w-[64px]" : "w-[220px]"
            }`}
        >
            {collapsed ? (
                /* Collapsed: icon stack with hover flyouts */
                <div className="flex flex-col items-center gap-[4px] py-[12px] px-[8px]">
                    {/* Dashboard */}
                    <button
                        onClick={handleDashboard}
                        title="Dashboard"
                        className={`w-full flex items-center justify-center py-[10px] rounded-xl cursor-pointer transition-colors ${
                            activeView === null ? "bg-accent/15 text-accent" : "text-foreground-light hover:bg-third/20"
                        }`}
                    >
                        <BiGridAlt className="text-[18pt]" />
                    </button>

                    {/* Section icons */}
                    {SECTIONS.map((s) => {
                        const sectionActive = s.items.some((i) => i.view === activeView);
                        return (
                            <div key={s.id} className="relative w-full"
                                onMouseEnter={() => openFlyout(s.id)}
                                onMouseLeave={closeFlyout}
                            >
                                <button
                                    className={`w-full flex items-center justify-center py-[10px] rounded-xl cursor-pointer transition-colors ${
                                        sectionActive ? "bg-accent/15 text-accent" : "text-foreground-light hover:bg-third/20"
                                    }`}
                                >
                                    <span className="text-[18pt]">{s.icon}</span>
                                </button>

                                {/* Flyout panel */}
                                {flyout === s.id && flyoutSection && (
                                    <div
                                        className="absolute left-[calc(100%+8px)] top-0 bg-primary border border-third/60 rounded-xl shadow-lg py-[8px] w-[180px] z-50"
                                        onMouseEnter={keepFlyout}
                                        onMouseLeave={closeFlyout}
                                    >
                                        <p className="text-[8pt] font-[600] uppercase tracking-wider text-foreground-light px-[12px] pb-[6px] border-b border-third/40 mb-[4px]">
                                            {flyoutSection.label}
                                        </p>
                                        {flyoutSection.items.map((item) => {
                                            const isActive = activeView === item.view;
                                            return (
                                                <button
                                                    key={String(item.view)}
                                                    onClick={() => { setActiveView(item.view); setFlyout(null); }}
                                                    className={`w-full flex items-center gap-[10px] px-[12px] py-[8px] cursor-pointer transition-colors text-left ${
                                                        isActive ? "bg-accent/15 text-accent" : "hover:bg-third/20 text-foreground"
                                                    }`}
                                                >
                                                    <span className={`text-[14pt] flex-shrink-0 ${isActive ? "text-accent" : "text-foreground-light"}`}>
                                                        {item.icon}
                                                    </span>
                                                    <span className="text-[10.5pt] font-[500]">{item.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* Expanded: horizontal icon strip + sub-items */
                <div className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex items-center gap-[4px] px-[10px] py-[10px] overflow-x-auto border-b border-third/30 flex-shrink-0">
                        <button
                            onClick={handleDashboard}
                            title="Dashboard"
                            className={`flex-shrink-0 w-[40px] h-[40px] flex items-center justify-center rounded-xl cursor-pointer transition-colors ${
                                activeView === null && openSection === null
                                    ? "bg-accent/15 text-accent"
                                    : "text-foreground-light hover:bg-third/20"
                            }`}
                        >
                            <BiGridAlt className="text-[18pt]" />
                        </button>
                        {SECTIONS.map((s) => {
                            const isOpen = openSection === s.id;
                            return (
                                <button
                                    key={s.id}
                                    onClick={() => handleSection(s.id)}
                                    title={s.label}
                                    className={`flex-shrink-0 w-[40px] h-[40px] flex items-center justify-center rounded-xl cursor-pointer transition-colors ${
                                        isOpen ? "bg-accent/15 text-accent" : "text-foreground-light hover:bg-third/20"
                                    }`}
                                >
                                    <span className="text-[18pt]">{s.icon}</span>
                                </button>
                            );
                        })}
                    </div>

                    {activeSection && (
                        <div className="flex flex-col gap-[2px] px-[8px] py-[10px] overflow-y-auto">
                            {activeSection.items.map((item) => {
                                const isActive = activeView === item.view;
                                return (
                                    <button
                                        key={item.view}
                                        onClick={() => setActiveView(item.view)}
                                        className={`w-full flex items-center gap-[10px] pl-[16px] pr-[12px] py-[9px] rounded-xl cursor-pointer transition-colors text-left ${
                                            isActive ? "bg-accent/15 text-accent" : "hover:bg-third/20 text-foreground"
                                        }`}
                                    >
                                        <span className={`text-[15pt] flex-shrink-0 ${isActive ? "text-accent" : "text-foreground-light"}`}>
                                            {item.icon}
                                        </span>
                                        <span className="text-[10.5pt] font-[500] whitespace-nowrap">{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Toggle button */}
            <button
                onClick={toggle}
                className="absolute top-1/2 -translate-y-1/2 -right-[14px] w-[28px] h-[28px] rounded-full bg-primary border border-third/60 shadow-sm flex items-center justify-center text-foreground hover:bg-primary-dark cursor-pointer transition-colors z-30"
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                {collapsed ? <BiChevronRight className="text-[14px]" /> : <BiChevronLeft className="text-[14px]" />}
            </button>
        </div>
    );
};

// ── Export ────────────────────────────────────────────────────────────────────

const AdminSidebar = () => {
    const { width } = useWindowSize();
    if (width === undefined) return null;
    return width < 768 ? <MobileSidebar /> : <DesktopSidebar />;
};

export default AdminSidebar;
