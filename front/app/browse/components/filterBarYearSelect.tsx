"use client";
import { useState } from "react";

interface FilterBarYearRangeProps {
    defaultMin?: string;
    defaultMax?: string;
    onChange: (min: string, max: string) => void;
}

const FilterBarYearRange = ({ defaultMin, defaultMax, onChange }: FilterBarYearRangeProps) => {
    const currentYear = new Date().getFullYear();
    const [min, setMin] = useState<string>(defaultMin ?? "");
    const [max, setMax] = useState<string>(defaultMax ?? "");

    const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMin(e.target.value);
        onChange(e.target.value, max);
    };

    const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMax(e.target.value);
        onChange(min, e.target.value);
    };

    return (
        <div className="flex flex-col">
            <label className="text-[8pt] font-[500] text-foreground-light leading-[100%]">Model Year</label>
            <div className="flex gap-[5px] items-center text-[11pt]">
                <input
                    type="number"
                    placeholder="Min"
                    min={1900}
                    max={currentYear}
                    value={min}
                    onChange={handleMinChange}
                    className="bg-primary-dark/70 border border-third rounded-md px-[10px] py-[5px] w-[80px]"
                />
                <span className="text-foreground-light text-[8pt] font-[900]">—</span>
                <input
                    type="number"
                    placeholder="Max"
                    min={1900}
                    max={currentYear}
                    value={max}
                    onChange={handleMaxChange}
                    className="bg-primary-dark/70 border border-third rounded-md px-[10px] py-[5px] w-[80px]"
                />
            </div>
        </div>
    );
};

export default FilterBarYearRange;
