"use client";
import { useState } from "react";

interface FilterBarInputProps {
	label: string;
	paramId: string;
	defaultValue?: string;
	placeholder?: string;
	onChange: (value: string | null) => void;
}

const FilterBarInput = ({
	label,
	defaultValue,
	placeholder,
	onChange,
}: FilterBarInputProps) => {
	const [value, setValue] = useState<string>(defaultValue ?? "");

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onChange(e.target.value === "" ? null : e.target.value);
	};

	return (
		<div className="flex flex-col h-full w-full">
			<label className="text-[8pt] text-foreground-light">{label}</label>
			<input
				type="text"
				value={value}
				placeholder={placeholder ?? label}
				onBlur={handleChange}
				onChange={(e) => setValue(e.target.value)}
				className="bg-primary-dark/20 outline-none border border-third rounded-xl px-[12px] py-[8px] w-full text-[11pt]"
			/>
		</div>
	);
};

export default FilterBarInput;
