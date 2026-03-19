"use client";
import { useState, useRef, useEffect } from "react";
import { VscSettings } from "react-icons/vsc";
import FilterBarDropdown from "./filterBarDropdown";
import FilterBarNumberRangeInline from "./filterBarNumberRangeInline";
import FilterBarInput from "./filterBarInput";
import PillSelect from "./pillSelect";
import { useFilterParams } from "./useFilterParams";

const Divider = () => <div className="w-full h-[1px] bg-third/50" />;
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
	<p className="text-foreground text-[13pt] font-[600]">{children}</p>
);

const FilterButton = () => {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	const { get, set, clear } = useFilterParams();

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
				className="text-[20pt] text-accent/80 border-transparent cursor-pointer hover:bg-primary-dark hover:border-third/70 rounded-2xl flex justify-center items-center text-center px-[15px] h-full self-stretch"
			>
				<VscSettings />
			</button>
			{open && (
				<div className="fixed left-0 right-0 bottom-0 top-0 pt-[72px] h-full w-full z-[100] flex items-center justify-center bg-black/40 px-[10px]">
					<div className="bg-primary rounded-2xl w-full max-w-[620px] max-h-[80vh] flex flex-col shadow-2xl z-50">
						{/* Header */}
						<div className="flex items-center justify-between px-[24px] py-[16px] border-b border-third/50">
							<div className="w-[32px]" />
							<h2 className="text-foreground text-[12pt] font-[600]">
								Filters
							</h2>
							<button
								onClick={() => setOpen(false)}
								className="w-[32px] h-[32px] flex items-center justify-center rounded-full hover:bg-third/30 text-foreground text-[14pt]"
							>
								✕
							</button>
						</div>

						{/* Scrollable content */}
						<div className="overflow-y-auto flex flex-col gap-[28px] px-[24px] py-[24px] w-full h-auto">
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
								onChange={(min, max) =>
									set({
										minPricePerDay: parseInt(min),
										maxPricePerDay: parseInt(max),
									})
								}
							/>

							<Divider />

							<FilterBarNumberRangeInline
								label="Model year"
								defaultMin={get("minModelYear")}
								defaultMax={get("maxModelYear")}
								min={1900}
								max={new Date().getFullYear()}
								onChange={(min, max) =>
									set({
										minModelYear: parseInt(min),
										maxModelYear: parseInt(max),
									})
								}
							/>

							<Divider />

							<div className="flex flex-col gap-[16px]">
								<SectionTitle>Body type</SectionTitle>
								<PillSelect
									selected={get("bodyType")}
									onChange={(v) => set({ bodyType: v ?? undefined })}
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

							<div className="flex flex-col gap-[16px]">
								<SectionTitle>Vehicle class</SectionTitle>
								<PillSelect
									selected={get("vehicleClass")}
									onChange={(v) => set({ vehicleClass: v ?? undefined })}
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

							<div className="flex flex-col gap-[16px]">
								<SectionTitle>Roof type</SectionTitle>
								<PillSelect
									selected={get("roofType")}
									onChange={(v) => set({ roofType: v ?? undefined })}
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

							<div className="flex flex-col gap-[16px]">
								<SectionTitle>Drivetrain</SectionTitle>
								<div className="grid grid-cols-2 gap-[12px]">
									<FilterBarDropdown
										label="Transmission"
										defaultValue={get("transmission")}
										onChange={(v) => set({ transmission: v ?? undefined })}
										options={[
											{ paramId: "AUTOMATIC", displayText: "Automatic" },
											{ paramId: "MANUAL", displayText: "Manual" },
										]}
									/>
									<FilterBarDropdown
										label="Drivetrain"
										defaultValue={get("drivetrain")}
										onChange={(v) => set({ drivetrain: v ?? undefined })}
										options={[
											{ paramId: "FWD", displayText: "FWD" },
											{ paramId: "RWD", displayText: "RWD" },
											{ paramId: "AWD", displayText: "AWD" },
										]}
									/>
									<FilterBarDropdown
										label="Engine Layout"
										defaultValue={get("engineLayout")}
										onChange={(v) => set({ engineLayout: v ?? undefined })}
										options={[
											{ paramId: "V", displayText: "V" },
											{ paramId: "INLINE", displayText: "Inline" },
											{ paramId: "FLAT", displayText: "Flat" },
											{ paramId: "SINGLE_MOTOR", displayText: "Single Motor" },
											{ paramId: "DUAL_MOTOR", displayText: "Dual Motor" },
										]}
									/>
									<FilterBarDropdown
										label="Fuel"
										defaultValue={get("fuel")}
										onChange={(v) => set({ fuel: v ?? undefined })}
										options={[
											{ paramId: "GASOLINE", displayText: "Gasoline" },
											{ paramId: "DIESEL", displayText: "Diesel" },
											{ paramId: "ELECTRIC", displayText: "Electric" },
											{ paramId: "HYBRID", displayText: "Hybrid" },
										]}
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
									onChange={(min, max) =>
										set({
											minHorsepower: parseInt(min),
											maxHorsepower: parseInt(max),
										})
									}
								/>
								<Divider />
								<FilterBarNumberRangeInline
									label="Torque (lb-ft)"
									defaultMin={get("minTorque")}
									defaultMax={get("maxTorque")}
									min={0}
									max={2000}
									onChange={(min, max) =>
										set({ minTorque: parseInt(min), maxTorque: parseInt(max) })
									}
								/>
								<Divider />
								<FilterBarNumberRangeInline
									label="MPG"
									defaultMin={get("minMpg")}
									defaultMax={get("maxMpg")}
									min={0}
									max={200}
									onChange={(min, max) =>
										set({ minMpg: parseInt(min), maxMpg: parseInt(max) })
									}
								/>
								<Divider />
								<FilterBarNumberRangeInline
									label="Seats"
									defaultMin={get("minSeats")}
									defaultMax={get("maxSeats")}
									min={1}
									max={12}
									onChange={(min, max) =>
										set({ minSeats: parseInt(min), maxSeats: parseInt(max) })
									}
								/>
								<Divider />
								<FilterBarNumberRangeInline
									label="Cylinders"
									defaultMin={get("minCylinders")}
									defaultMax={get("maxCylinders")}
									min={0}
									max={16}
									onChange={(min, max) =>
										set({
											minCylinders: parseInt(min),
											maxCylinders: parseInt(max),
										})
									}
								/>
								<Divider />
								<FilterBarNumberRangeInline
									label="Gears"
									defaultMin={get("minGears")}
									defaultMax={get("maxGears")}
									min={1}
									max={12}
									onChange={(min, max) =>
										set({ minGears: parseInt(min), maxGears: parseInt(max) })
									}
								/>
							</div>
						</div>

						{/* Footer */}
						<div className="flex items-center justify-between px-[24px] py-[16px] border-t border-third/50">
							<button
								onClick={() => {
									clear();
									setOpen(false);
								}}
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
