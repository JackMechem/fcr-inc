"use client"
import { useState } from "react";

interface QueryOption {
    paramId: string;
    displayText?: string;
}

interface FilterBarDropdownProps {
    label: string;
    options: QueryOption[];
    defaultValue?: string;
    showAll?: boolean;
    onChange: (value: string | null) => void;
}

const FilterBarDropdown = ({ label, options, defaultValue, showAll = true, onChange }: FilterBarDropdownProps) => {
    const [selected, setSelected] = useState<string>(defaultValue ?? (showAll ? "" : options[0].paramId));

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelected(e.target.value);
        onChange(e.target.value === "" ? null : e.target.value);
    };

    return (
        <div className="flex flex-col">
            <label className="text-[8pt] font-[500] text-foreground-light leading-[100%]">{label}</label>
            <select className="bg-primary-dark/70 border border-third rounded-md px-[10px] py-[5px] w-fit text-[11pt]" value={selected} onChange={handleChange}>
                {showAll && <option value="">All</option>}
                {options.map((option) => (
                    <option key={option.paramId} value={option.paramId}>
                        {option.displayText ?? option.paramId}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default FilterBarDropdown;
