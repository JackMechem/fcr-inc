"use client";

import { useState } from "react";
import Image from "next/image";
import { BiCar, BiCheck, BiSearch, BiX } from "react-icons/bi";
import { inputCls } from "./Field";

export interface CopyOption {
	vin: string;
	make: string;
	model: string;
	modelYear: number;
	images: string[];
	vehicleClass: string;
	pricePerDay: number;
}

interface CopyPickerProps {
	options: CopyOption[];
	selectedVin: string | null;
	onSelect: (vin: string | null) => void;
	mode: "add" | "edit";
}

const CopyPicker = ({ options, selectedVin, onSelect, mode }: CopyPickerProps) => {
	const [query, setQuery] = useState("");

	const filtered = options
		.filter((o) =>
			`${o.make} ${o.model} ${o.vin}`
				.toLowerCase()
				.includes(query.toLowerCase()),
		)
		.slice(0, 10);

	return (
		<div className="bg-primary border border-third/60 rounded-2xl p-[20px] flex flex-col gap-[14px]">
			<div className="flex items-center justify-between">
				<p className="text-foreground text-[11pt] font-[600]">
					{mode === "edit" ? "Select a vehicle to edit" : "Copy from existing vehicle"}
				</p>
				{selectedVin && (
					<button
						type="button"
						onClick={() => onSelect(null)}
						className="flex items-center gap-[4px] text-[9pt] text-foreground-light hover:text-accent transition-colors cursor-pointer"
					>
						<BiX /> Clear
					</button>
				)}
			</div>

			{/* Search */}
			<div className="relative">
				<BiSearch className="absolute left-[12px] top-1/2 -translate-y-1/2 text-foreground-light text-[13pt]" />
				<input
					className={`${inputCls} pl-[36px]`}
					placeholder={
						mode === "edit"
							? "Search for a vehicle to edit…"
							: "Search by make, model or VIN…"
					}
					value={query}
					onChange={(e) => setQuery(e.target.value)}
				/>
			</div>

			{/* Card strip */}
			<div className="flex gap-[12px] overflow-x-auto pb-[4px] scrollbar-hide">
				{filtered.length === 0 && (
					<p className="text-foreground-light text-[10pt] py-[8px]">
						No vehicles found.
					</p>
				)}
				{filtered.map((car) => {
					const isSelected = selectedVin === car.vin;
					return (
						<button
							key={car.vin}
							type="button"
							onClick={() => onSelect(isSelected ? null : car.vin)}
							className={`flex-shrink-0 w-[160px] rounded-xl overflow-hidden border-2 transition-all cursor-pointer text-left ${
								isSelected
									? "border-accent shadow-md shadow-accent/20"
									: "border-third hover:border-accent/40"
							}`}
						>
							{/* Image */}
							<div className="relative w-full h-[90px] bg-third/30">
								{car.images?.[0] ? (
									<Image
										src={car.images[0]}
										alt={`${car.make} ${car.model}`}
										fill
										className="object-cover"
										sizes="160px"
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center text-foreground-light/40">
										<BiCar className="text-[30pt]" />
									</div>
								)}
								{isSelected && (
									<div className="absolute top-[6px] right-[6px] w-[22px] h-[22px] rounded-full bg-accent flex items-center justify-center text-primary">
										<BiCheck className="text-[13px]" />
									</div>
								)}
							</div>
							{/* Info */}
							<div className="px-[10px] py-[8px]">
								<p className="text-foreground text-[9.5pt] font-[600] truncate">
									{car.make} {car.model}
								</p>
								<p className="text-foreground-light text-[8.5pt]">{car.modelYear}</p>
								<p className="text-accent text-[8.5pt] font-[500] mt-[2px]">
									${car.pricePerDay}/day
								</p>
							</div>
						</button>
					);
				})}
			</div>
		</div>
	);
};

export default CopyPicker;
