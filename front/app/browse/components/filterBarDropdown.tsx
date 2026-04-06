"use client";
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

const FilterBarDropdown = ({
	label,
	options,
	defaultValue,
	showAll = true,
	onChange,
}: FilterBarDropdownProps) => {
	const [selected, setSelected] = useState<string>(
		defaultValue ?? (showAll ? "" : options[0].paramId),
	);

	const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setSelected(e.target.value);
		onChange(e.target.value === "" ? null : e.target.value);
	};

	return (
		<div className="flex flex-col gap-[4px]">
			{label != "" && (
				<label className="text-foreground-light text-[8pt]">{label}</label>
			)}
			<select
				className={`bg-primary-dark/20 outline-none ${label != "" && "border"} border-third rounded-xl px-[12px] py-[8px] w-full text-[11pt] cursor-pointer`}
				value={selected}
				onChange={handleChange}
			>
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
