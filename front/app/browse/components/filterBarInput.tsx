"use client"
import { useState } from "react";

interface FilterBarInputProps {
    label: string;
    paramId: string;
    defaultValue?: string;
    placeholder?: string;
    onChange: (value: string | null) => void;
}

const FilterBarInput = ({ label, defaultValue, placeholder, onChange }: FilterBarInputProps) => {
    const [value, setValue] = useState<string>(defaultValue ?? "");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);
        onChange(e.target.value === "" ? null : e.target.value);
    };

    return (
        <div className="flex flex-col h-full">
            <label className="text-[8pt] h-full ml-[2px] font-[500] text-foreground-light leading-[100%]">{label}</label>
            <input
                type="text"
                value={value}
                placeholder={placeholder ?? label}
                onChange={handleChange}
                className="bg-primary border border-third outline-none rounded-lg px-[10px] py-[5px] w-fit text-[11pt]"
            />
        </div>
    );
};

export default FilterBarInput;
