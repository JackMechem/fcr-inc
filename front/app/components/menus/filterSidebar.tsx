"use client";

import { useSidebarStore } from "@/stores/sidebarStore";
import { useFilterParams } from "@/app/browse/components/useFilterParams";
import FilterBarDropdown from "@/app/browse/components/filterBarDropdown";
import FilterBarNumberRangeInline from "@/app/browse/components/filterBarNumberRangeInline";
import FilterBarInput from "@/app/browse/components/filterBarInput";
import PillSelect from "@/app/browse/components/pillSelect";
import { BiX } from "react-icons/bi";

const Divider = () => <div className="w-full h-[1px] bg-third/50" />;
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <p className="text-foreground text-[13pt] font-[600]">{children}</p>
);

const toOptions = (values: string[] = []) =>
    values.map((v) => ({
        paramId: v,
        displayText: v.charAt(0).toUpperCase() + v.slice(1).toLowerCase().replace(/_/g, " "),
    }));

const FilterSidebar = () => {
    const { openPanel, close, filterEnums } = useSidebarStore();
    const { get, set, clear } = useFilterParams();
    const isOpen = openPanel === "filter";

    return (
        <div
            className={`fixed top-0 right-0 h-full z-50 w-full md:w-[380px] bg-primary border-l border-third shadow-xl flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-third/50 flex-shrink-0">
                <button
                    onClick={close}
                    className="w-[32px] h-[32px] flex items-center justify-center rounded-full hover:bg-third/30 text-foreground text-[16pt] transition-colors"
                >
                    <BiX />
                </button>
                <h2 className="text-foreground text-[12pt] font-[600]">Filters</h2>
                <div className="w-[32px]" />
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-[28px] px-6 py-6">
                {filterEnums && (
                    <>
                        <div className="flex flex-col gap-[16px]">
                            <SectionTitle>Search</SectionTitle>
                            <div className="flex gap-[12px]">
                                <FilterBarInput
                                    label="Make"
                                    paramId="make"
                                    defaultValue={get("make")}
                                    onChange={(v) => set({ make: v ?? undefined })}
                                />
                                <FilterBarInput
                                    label="Model"
                                    paramId="model"
                                    defaultValue={get("model")}
                                    onChange={(v) => set({ model: v ?? undefined })}
                                />
                            </div>
                        </div>

                        <Divider />

                        <FilterBarNumberRangeInline
                            label="Price per day"
                            defaultMin={get("minPricePerDay")}
                            defaultMax={get("maxPricePerDay")}
                            min={0}
                            max={2000}
                            onChange={(min, max) => set({ minPricePerDay: parseInt(min), maxPricePerDay: parseInt(max) })}
                        />

                        <Divider />

                        <FilterBarNumberRangeInline
                            label="Model year"
                            defaultMin={get("minModelYear")}
                            defaultMax={get("maxModelYear")}
                            min={1900}
                            max={new Date().getFullYear()}
                            onChange={(min, max) => set({ minModelYear: parseInt(min), maxModelYear: parseInt(max) })}
                        />

                        <Divider />

                        <div className="flex flex-col gap-[16px]">
                            <SectionTitle>Body type</SectionTitle>
                            <PillSelect
                                selected={get("bodyType")}
                                onChange={(v) => set({ bodyType: v ?? undefined })}
                                options={toOptions(filterEnums.bodyType)}
                            />
                        </div>

                        <Divider />

                        <div className="flex flex-col gap-[16px]">
                            <SectionTitle>Vehicle class</SectionTitle>
                            <PillSelect
                                selected={get("vehicleClass")}
                                onChange={(v) => set({ vehicleClass: v ?? undefined })}
                                options={toOptions(filterEnums.vehicleClass)}
                            />
                        </div>

                        <Divider />

                        <div className="flex flex-col gap-[16px]">
                            <SectionTitle>Roof type</SectionTitle>
                            <PillSelect
                                selected={get("roofType")}
                                onChange={(v) => set({ roofType: v ?? undefined })}
                                options={toOptions(filterEnums.roofType)}
                            />
                        </div>

                        <Divider />

                        <div className="flex flex-col gap-[16px]">
                            <SectionTitle>Drivetrain</SectionTitle>
                            <div className="grid grid-cols-2 gap-[12px]">
                                <FilterBarDropdown
                                    label="Transmission"
                                    defaultValue={get("transmission")}
                                    onChange={(v) => set({ transmission: v ?? undefined })}
                                    options={toOptions(filterEnums.transmissionType)}
                                />
                                <FilterBarDropdown
                                    label="Drivetrain"
                                    defaultValue={get("drivetrain")}
                                    onChange={(v) => set({ drivetrain: v ?? undefined })}
                                    options={toOptions(filterEnums.drivetrain)}
                                />
                                <FilterBarDropdown
                                    label="Engine Layout"
                                    defaultValue={get("engineLayout")}
                                    onChange={(v) => set({ engineLayout: v ?? undefined })}
                                    options={toOptions(filterEnums.engineLayout)}
                                />
                                <FilterBarDropdown
                                    label="Fuel"
                                    defaultValue={get("fuel")}
                                    onChange={(v) => set({ fuel: v ?? undefined })}
                                    options={toOptions(filterEnums.fuelType)}
                                />
                            </div>
                        </div>

                        <Divider />

                        <div className="flex flex-col gap-[28px]">
                            <SectionTitle>Performance</SectionTitle>
                            <FilterBarNumberRangeInline
                                label="Horsepower"
                                defaultMin={get("minHorsepower")}
                                defaultMax={get("maxHorsepower")}
                                min={0}
                                max={2000}
                                onChange={(min, max) => set({ minHorsepower: parseInt(min), maxHorsepower: parseInt(max) })}
                            />
                            <Divider />
                            <FilterBarNumberRangeInline
                                label="Torque (lb-ft)"
                                defaultMin={get("minTorque")}
                                defaultMax={get("maxTorque")}
                                min={0}
                                max={2000}
                                onChange={(min, max) => set({ minTorque: parseInt(min), maxTorque: parseInt(max) })}
                            />
                            <Divider />
                            <FilterBarNumberRangeInline
                                label="MPG"
                                defaultMin={get("minMpg")}
                                defaultMax={get("maxMpg")}
                                min={0}
                                max={200}
                                onChange={(min, max) => set({ minMpg: parseInt(min), maxMpg: parseInt(max) })}
                            />
                            <Divider />
                            <FilterBarNumberRangeInline
                                label="Seats"
                                defaultMin={get("minSeats")}
                                defaultMax={get("maxSeats")}
                                min={1}
                                max={12}
                                onChange={(min, max) => set({ minSeats: parseInt(min), maxSeats: parseInt(max) })}
                            />
                            <Divider />
                            <FilterBarNumberRangeInline
                                label="Cylinders"
                                defaultMin={get("minCylinders")}
                                defaultMax={get("maxCylinders")}
                                min={0}
                                max={16}
                                onChange={(min, max) => set({ minCylinders: parseInt(min), maxCylinders: parseInt(max) })}
                            />
                            <Divider />
                            <FilterBarNumberRangeInline
                                label="Gears"
                                defaultMin={get("minGears")}
                                defaultMax={get("maxGears")}
                                min={1}
                                max={12}
                                onChange={(min, max) => set({ minGears: parseInt(min), maxGears: parseInt(max) })}
                            />
                        </div>
                    </>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-third/50 flex-shrink-0">
                <button
                    onClick={() => { clear(); close(); }}
                    className="text-foreground text-[11pt] font-[500] underline underline-offset-2 hover:text-accent transition-colors"
                >
                    Clear all
                </button>
                <button
                    onClick={close}
                    className="bg-accent/90 text-primary font-[500] text-[11pt] px-[20px] py-[10px] rounded-xl hover:brightness-110 transition"
                >
                    Show results
                </button>
            </div>
        </div>
    );
};

export default FilterSidebar;
