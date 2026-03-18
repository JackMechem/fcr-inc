"use client";
import { useState, useRef, useEffect } from "react";
import { VscSettings } from "react-icons/vsc";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import FilterBarDropdown from "./filterBarDropdown";
import FilterBarNumberRangeInline from "./filterBarNumberRangeInline";
import FilterBarInput from "./filterBarInput";
import PillSelect from "./pillSelect";

interface FilterAndSelectFields {
    page?: string;
    pageSize?: string;
    select?: string;
    sortBy?: string;
    sortDir?: string;
    make?: string;
    model?: string;
    minModelYear?: string;
    maxModelYear?: string;
    transmission?: string;
    drivetrain?: string;
    engineLayout?: string;
    fuel?: string;
    bodyType?: string;
    roofType?: string;
    vehicleClass?: string;
    minHorsepower?: string;
    maxHorsepower?: string;
    minTorque?: string;
    maxTorque?: string;
    minSeats?: string;
    maxSeats?: string;
    minMpg?: string;
    maxMpg?: string;
    minCylinders?: string;
    maxCylinders?: string;
    minGears?: string;
    maxGears?: string;
    minPricePerDay?: string;
    maxPricePerDay?: string;
}

const Divider = () => <div className="w-full h-[1px] bg-third/50" />;
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <p className="text-foreground text-[13pt] font-[600]">{children}</p>
);

const FilterButton = () => {
    const [open, setOpen] = useState(false);
    const [localParams, setLocalParams] = useState<Partial<FilterAndSelectFields>>({});
    const ref = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        const initial: Partial<FilterAndSelectFields> = {};
        searchParams.forEach((value, key) => {
            initial[key as keyof FilterAndSelectFields] = value;
        });
        setLocalParams(initial);
    }, [searchParams]);

    const get = (key: keyof FilterAndSelectFields) => searchParams.get(key) ?? undefined;
    const getLocal = (key: keyof FilterAndSelectFields) => localParams[key] ?? get(key);

    const applyParam = (param: keyof FilterAndSelectFields, value: string | null) => {
        setLocalParams((prev) => ({ ...prev, [param]: value ?? undefined }));
        const params = new URLSearchParams(searchParams.toString());
        if (value) params.set(param, value);
        else params.delete(param);
        router.push(`${pathname}?${params.toString()}`);
    };

    const applyMultiple = (updates: Partial<FilterAndSelectFields>) => {
        const params = new URLSearchParams(searchParams.toString());
        for (const [key, value] of Object.entries(updates)) {
            if (value) params.set(key, value);
            else params.delete(key);
        }
        router.push(`${pathname}?${params.toString()}`);
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node))
                setOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={ref} className="relative h-fill self-stretch">
            <button
                onClick={() => setOpen((prev) => !prev)}
                className="text-[20pt] text-foreground-light/80 border border-transparent cursor-pointer hover:border-third/70 rounded-2xl flex justify-center items-center text-center px-[20px] h-full self-stretch"
            >
                <VscSettings />
            </button>
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-primary rounded-2xl w-full max-w-[620px] max-h-[90vh] flex flex-col shadow-2xl">

                        {/* Header */}
                        <div className="flex items-center justify-between px-[24px] py-[16px] border-b border-third/50">
                            <div className="w-[32px]" />
                            <h2 className="text-foreground text-[12pt] font-[600]">Filters</h2>
                            <button
                                onClick={() => setOpen(false)}
                                className="w-[32px] h-[32px] flex items-center justify-center rounded-full hover:bg-third/30 text-foreground text-[14pt]"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Scrollable content */}
                        <div className="overflow-y-auto flex flex-col gap-[28px] px-[24px] py-[24px]">

                            {/* Search */}
                            <div className="flex flex-col gap-[16px]">
                                <SectionTitle>Search</SectionTitle>
                                <div className="flex gap-[12px]">
                                    <FilterBarInput label="Make" paramId="make" defaultValue={get("make")} onChange={(v) => applyParam("make", v)} />
                                    <FilterBarInput label="Model" paramId="model" defaultValue={get("model")} onChange={(v) => applyParam("model", v)} />
                                </div>
                            </div>

                            <Divider />

                            {/* Price */}
                            <FilterBarNumberRangeInline
                                label="Price per day"
                                defaultMin={get("minPricePerDay")}
                                defaultMax={get("maxPricePerDay")}
                                min={0} max={2000}
                                onChange={(min, max) => applyMultiple({ minPricePerDay: min, maxPricePerDay: max })}
                            />

                            <Divider />

                            {/* Model Year */}
                            <FilterBarNumberRangeInline
                                label="Model year"
                                defaultMin={get("minModelYear")}
                                defaultMax={get("maxModelYear")}
                                min={1900} max={new Date().getFullYear()}
                                onChange={(min, max) => applyMultiple({ minModelYear: min, maxModelYear: max })}
                            />

                            <Divider />

                            {/* Body Type */}
                            <div className="flex flex-col gap-[16px]">
                                <SectionTitle>Body type</SectionTitle>
                                <PillSelect
                                    selected={getLocal("bodyType")}
                                    onChange={(v) => applyParam("bodyType", v)}
                                    options={[
                                        { paramId: "SEDAN", displayText: "Sedan" },
                                        { paramId: "SUV", displayText: "SUV" },
                                        { paramId: "TRUCK", displayText: "Truck" },
                                        { paramId: "CONVERTIBLE", displayText: "Convertible" },
                                        { paramId: "HATCHBACK", displayText: "Hatchback" },
                                        { paramId: "FULL_SIZE", displayText: "Full Size" },
                                        { paramId: "COMPACT", displayText: "Compact" },
                                        { paramId: "WAGON", displayText: "Wagon" },
                                        { paramId: "ELECTRIC", displayText: "Electric" },
                                        { paramId: "COUPE", displayText: "Coupe" },
                                    ]}
                                />
                            </div>

                            <Divider />

                            {/* Vehicle Class */}
                            <div className="flex flex-col gap-[16px]">
                                <SectionTitle>Vehicle class</SectionTitle>
                                <PillSelect
                                    selected={getLocal("vehicleClass")}
                                    onChange={(v) => applyParam("vehicleClass", v)}
                                    options={[
                                        { paramId: "ECONOMY", displayText: "Economy" },
                                        { paramId: "LUXURY", displayText: "Luxury" },
                                        { paramId: "PERFORMANCE", displayText: "Performance" },
                                        { paramId: "OFFROAD", displayText: "Off Road" },
                                        { paramId: "FULL_SIZE", displayText: "Full Size" },
                                        { paramId: "ELECTRIC", displayText: "Electric" },
                                    ]}
                                />
                            </div>

                            <Divider />

                            {/* Roof Type */}
                            <div className="flex flex-col gap-[16px]">
                                <SectionTitle>Roof type</SectionTitle>
                                <PillSelect
                                    selected={getLocal("roofType")}
                                    onChange={(v) => applyParam("roofType", v)}
                                    options={[
                                        { paramId: "SOFTTOP", displayText: "Soft Top" },
                                        { paramId: "HARDTOP", displayText: "Hard Top" },
                                        { paramId: "TARGA", displayText: "Targa" },
                                        { paramId: "SLICKTOP", displayText: "Slick Top" },
                                        { paramId: "SUNROOF", displayText: "Sunroof" },
                                        { paramId: "PANORAMIC", displayText: "Panoramic" },
                                    ]}
                                />
                            </div>

                            <Divider />

                            {/* Drivetrain */}
                            <div className="flex flex-col gap-[16px]">
                                <SectionTitle>Drivetrain</SectionTitle>
                                <div className="grid grid-cols-2 gap-[12px]">
                                    <FilterBarDropdown label="Transmission" options={[{ paramId: "AUTOMATIC", displayText: "Automatic" }, { paramId: "MANUAL", displayText: "Manual" }]} defaultValue={getLocal("transmission")} onChange={(v) => applyParam("transmission", v)} />
                                    <FilterBarDropdown label="Drivetrain" options={[{ paramId: "FWD", displayText: "FWD" }, { paramId: "RWD", displayText: "RWD" }, { paramId: "AWD", displayText: "AWD" }]} defaultValue={getLocal("drivetrain")} onChange={(v) => applyParam("drivetrain", v)} />
                                    <FilterBarDropdown label="Engine Layout" options={[{ paramId: "V", displayText: "V" }, { paramId: "INLINE", displayText: "Inline" }, { paramId: "FLAT", displayText: "Flat" }, { paramId: "SINGLE_MOTOR", displayText: "Single Motor" }, { paramId: "DUAL_MOTOR", displayText: "Dual Motor" }]} defaultValue={getLocal("engineLayout")} onChange={(v) => applyParam("engineLayout", v)} />
                                    <FilterBarDropdown label="Fuel" options={[{ paramId: "GASOLINE", displayText: "Gasoline" }, { paramId: "DIESEL", displayText: "Diesel" }, { paramId: "ELECTRIC", displayText: "Electric" }, { paramId: "HYBRID", displayText: "Hybrid" }]} defaultValue={getLocal("fuel")} onChange={(v) => applyParam("fuel", v)} />
                                </div>
                            </div>

                            <Divider />

                            {/* Performance */}
                            <div className="flex flex-col gap-[28px]">
                                <SectionTitle>Performance</SectionTitle>
                                <FilterBarNumberRangeInline label="Horsepower" defaultMin={get("minHorsepower")} defaultMax={get("maxHorsepower")} min={0} max={2000} onChange={(min, max) => applyMultiple({ minHorsepower: min, maxHorsepower: max })} />
                                <Divider />
                                <FilterBarNumberRangeInline label="Torque (lb-ft)" defaultMin={get("minTorque")} defaultMax={get("maxTorque")} min={0} max={2000} onChange={(min, max) => applyMultiple({ minTorque: min, maxTorque: max })} />
                                <Divider />
                                <FilterBarNumberRangeInline label="MPG" defaultMin={get("minMpg")} defaultMax={get("maxMpg")} min={0} max={200} onChange={(min, max) => applyMultiple({ minMpg: min, maxMpg: max })} />
                                <Divider />
                                <FilterBarNumberRangeInline label="Seats" defaultMin={get("minSeats")} defaultMax={get("maxSeats")} min={1} max={12} onChange={(min, max) => applyMultiple({ minSeats: min, maxSeats: max })} />
                                <Divider />
                                <FilterBarNumberRangeInline label="Cylinders" defaultMin={get("minCylinders")} defaultMax={get("maxCylinders")} min={0} max={16} onChange={(min, max) => applyMultiple({ minCylinders: min, maxCylinders: max })} />
                                <Divider />
                                <FilterBarNumberRangeInline label="Gears" defaultMin={get("minGears")} defaultMax={get("maxGears")} min={1} max={12} onChange={(min, max) => applyMultiple({ minGears: min, maxGears: max })} />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between px-[24px] py-[16px] border-t border-third/50">
                            <button
                                onClick={() => { router.push(pathname); setOpen(false); }}
                                className="text-foreground text-[11pt] font-[500] underline underline-offset-2"
                            >
                                Clear all
                            </button>
                            <button
                                onClick={() => setOpen(false)}
                                className="bg-accent/90 text-primary-dark font-[500] text-[11pt] px-[20px] py-[10px] rounded-xl"
                            >
                                Show results
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FilterButton;
