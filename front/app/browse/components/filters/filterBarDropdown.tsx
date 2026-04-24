"use client";
import { useState } from "react";
import styles from "./filterBarDropdown.module.css";

interface QueryOption {
	paramId: string;
	displayText?: string;
}

interface FilterBarDropdownProps {
	label: string;
	options: QueryOption[];
	defaultValue?: string;
	showAll?: boolean;
	className?: string;
	onChange: (value: string | null) => void;
}

const FilterBarDropdown = ({
	label,
	options,
	defaultValue,
	showAll = true,
	className,
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
		<div className={`${styles.wrapper} ${className ?? ""}`}>
			{label !== "" && (
				<label className={styles.label}>{label}</label>
			)}
			<select
				className={label !== "" ? styles.select : styles.selectNoLabel}
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
