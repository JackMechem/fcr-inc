"use client";

import { useEffect, useState } from "react";
import { getFilteredCars } from "@/app/lib/CarApi";
import { Car } from "@/app/types/CarTypes";
import { useAdminSidebarStore, AdminView } from "@/stores/adminSidebarStore";
import { BiCar, BiPlus, BiEdit, BiTable, BiCalendar } from "react-icons/bi";
import { MdAttachMoney, MdSpeed, MdDirectionsCar } from "react-icons/md";

// ── Helpers ──────────────────────────────────────────────────────────────────

const avg = (nums: number[]) =>
    nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0;

const countBy = (cars: Car[], key: keyof Car): Record<string, number> =>
    cars.reduce<Record<string, number>>((acc, car) => {
        const val = String(car[key] ?? "Unknown");
        acc[val] = (acc[val] ?? 0) + 1;
        return acc;
    }, {});

const fmt = (label: string) =>
    label.charAt(0).toUpperCase() + label.slice(1).toLowerCase().replace(/_/g, " ");

// ── Sub-components ────────────────────────────────────────────────────────────

const StatCard = ({
    icon,
    label,
    value,
    sub,
}: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    sub?: string;
}) => (
    <div className="bg-primary border border-third/40 rounded-2xl p-[20px] flex flex-col gap-[8px] shadow-sm">
        <div className="flex items-center gap-[8px] text-foreground-light text-[11pt]">
            <span className="text-accent text-[16pt]">{icon}</span>
            {label}
        </div>
        <p className="text-foreground text-[22pt] font-[700] leading-none">{value}</p>
        {sub && <p className="text-foreground-light text-[9pt]">{sub}</p>}
    </div>
);

const BreakdownBar = ({ label, count, total, color }: { label: string; count: number; total: number; color: string }) => {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
        <div className="flex flex-col gap-[4px]">
            <div className="flex justify-between text-[9.5pt]">
                <span className="text-foreground font-[500]">{fmt(label)}</span>
                <span className="text-foreground-light">{count} · {pct}%</span>
            </div>
            <div className="w-full h-[6px] bg-third/30 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
};

const NAV_SECTIONS = [
    {
        id: "cars",
        icon: <BiCar />,
        label: "Cars",
        items: [
            { icon: <BiPlus />,  label: "Add Car",   view: "add-car"   as AdminView },
            { icon: <BiEdit />,  label: "Edit Car",  view: "edit-car"  as AdminView },
            { icon: <BiTable />, label: "View Data", view: "view-data" as AdminView },
        ],
    },
    {
        id: "reservations",
        icon: <BiCalendar />,
        label: "Reservations",
        items: [
            { icon: <BiTable />, label: "View Data", view: "view-reservations" as AdminView },
        ],
    },
];

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <p className="text-foreground text-[13pt] font-[600] mb-[14px]">{children}</p>
);

const barColors = [
    "bg-accent",
    "bg-blue-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-purple-500",
    "bg-rose-500",
    "bg-cyan-500",
    "bg-orange-400",
];

// ── Dashboard ─────────────────────────────────────────────────────────────────

const DashboardPanel = () => {
    const { setActiveView } = useAdminSidebarStore();
    const [cars, setCars] = useState<Car[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getFilteredCars({ pageSize: 500 })
            .then((res) => {
                setCars(res.data);
                setTotalItems(res.totalItems);
            })
            .catch((e) => setError(String(e)))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col gap-[16px]">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-[80px] rounded-2xl bg-third/20 animate-pulse" />
                ))}
            </div>
        );
    }

    if (error) {
        return <p className="text-red-500 text-[11pt]">Failed to load dashboard: {error}</p>;
    }

    const prices = cars.map((c) => c.pricePerDay).filter(Boolean);
    const hps = cars.map((c) => c.horsepower).filter(Boolean);
    const makes = new Set(cars.map((c) => c.make)).size;
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 0;

    const byBodyType = countBy(cars, "bodyType");
    const byClass = countBy(cars, "vehicleClass");
    const byFuel = countBy(cars, "fuel");

    const topCars = [...cars]
        .sort((a, b) => b.pricePerDay - a.pricePerDay)
        .slice(0, 5);

    return (
        <div className="flex flex-col gap-[40px] pb-[40px]">
            <div>
                <h1 className="text-foreground text-[28pt] font-[700] leading-tight">Admin Dashboard</h1>
                <p className="text-foreground-light text-[11pt] mt-[4px]">Fleet overview and quick actions</p>
            </div>

            {/* ── Stat cards ── */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-[16px]">
                <StatCard icon={<BiCar />} label="Total Vehicles" value={totalItems} />
                <StatCard icon={<MdDirectionsCar />} label="Unique Makes" value={makes} />
                <StatCard
                    icon={<MdAttachMoney />}
                    label="Avg Price / Day"
                    value={`$${avg(prices)}`}
                    sub={`Range: $${minPrice} – $${maxPrice}`}
                />
                <StatCard
                    icon={<MdSpeed />}
                    label="Avg Horsepower"
                    value={`${avg(hps)} hp`}
                />
            </div>

            {/* ── Breakdowns ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-[24px]">
                <div className="bg-primary border border-third/40 rounded-2xl p-[20px] shadow-sm flex flex-col gap-[12px]">
                    <SectionTitle>Body Type</SectionTitle>
                    {Object.entries(byBodyType)
                        .sort((a, b) => b[1] - a[1])
                        .map(([label, count], i) => (
                            <BreakdownBar key={label} label={label} count={count} total={cars.length} color={barColors[i % barColors.length]} />
                        ))}
                </div>

                <div className="bg-primary border border-third/40 rounded-2xl p-[20px] shadow-sm flex flex-col gap-[12px]">
                    <SectionTitle>Vehicle Class</SectionTitle>
                    {Object.entries(byClass)
                        .sort((a, b) => b[1] - a[1])
                        .map(([label, count], i) => (
                            <BreakdownBar key={label} label={label} count={count} total={cars.length} color={barColors[i % barColors.length]} />
                        ))}
                </div>

                <div className="bg-primary border border-third/40 rounded-2xl p-[20px] shadow-sm flex flex-col gap-[12px]">
                    <SectionTitle>Fuel Type</SectionTitle>
                    {Object.entries(byFuel)
                        .sort((a, b) => b[1] - a[1])
                        .map(([label, count], i) => (
                            <BreakdownBar key={label} label={label} count={count} total={cars.length} color={barColors[i % barColors.length]} />
                        ))}
                </div>
            </div>

            {/* ── Top by price ── */}
            <div className="bg-primary border border-third/40 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-[20px] py-[16px] border-b border-third/40">
                    <SectionTitle>Top 5 by Price / Day</SectionTitle>
                </div>
                <table className="w-full text-[10.5pt]">
                    <thead>
                        <tr className="text-foreground-light text-left border-b border-third/30">
                            <th className="px-[20px] py-[10px] font-[500]">Vehicle</th>
                            <th className="px-[20px] py-[10px] font-[500]">Year</th>
                            <th className="px-[20px] py-[10px] font-[500]">Class</th>
                            <th className="px-[20px] py-[10px] font-[500] text-right">Price / Day</th>
                        </tr>
                    </thead>
                    <tbody>
                        {topCars.map((car, i) => (
                            <tr key={car.vin} className={`border-b border-third/20 ${i % 2 === 0 ? "" : "bg-third/5"}`}>
                                <td className="px-[20px] py-[12px] font-[500] text-foreground">{car.make} {car.model}</td>
                                <td className="px-[20px] py-[12px] text-foreground-light">{car.modelYear}</td>
                                <td className="px-[20px] py-[12px] text-foreground-light">{fmt(car.vehicleClass)}</td>
                                <td className="px-[20px] py-[12px] text-accent font-[600] text-right">${car.pricePerDay}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ── Sections ── */}
            <div className="flex flex-col gap-[20px]">
                <SectionTitle>Sections</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
                    {NAV_SECTIONS.map((section) => (
                        <div key={section.id} className="bg-primary border border-third/40 rounded-2xl overflow-hidden shadow-sm">
                            {/* Section header */}
                            <div className="flex items-center gap-[10px] px-[20px] py-[14px] border-b border-third/30 bg-primary-dark/20">
                                <span className="text-accent text-[18pt]">{section.icon}</span>
                                <span className="text-foreground text-[12pt] font-[600]">{section.label}</span>
                            </div>
                            {/* Sub-items */}
                            <div className="flex flex-col divide-y divide-third/20">
                                {section.items.map((item) => (
                                    <button
                                        key={String(item.view)}
                                        onClick={() => setActiveView(item.view)}
                                        className="flex items-center gap-[12px] px-[20px] py-[14px] hover:bg-accent/5 hover:text-accent text-foreground transition-colors cursor-pointer text-left group"
                                    >
                                        <span className="text-foreground-light text-[16pt] group-hover:text-accent transition-colors">{item.icon}</span>
                                        <span className="text-[11pt] font-[500]">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DashboardPanel;
