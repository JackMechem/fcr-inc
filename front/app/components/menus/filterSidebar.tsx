"use client";

import { useSidebarStore } from "@/stores/sidebarStore";
import { useFilterParams } from "@/app/browse/components/useFilterParams";
import FilterBarDropdown from "@/app/browse/components/filterBarDropdown";
import FilterBarNumberRangeInline from "@/app/browse/components/filterBarNumberRangeInline";
import PillSelect from "@/app/browse/components/pillSelect";
import { BiX } from "react-icons/bi";
import styles from "./filterSidebar.module.css";

const Divider = () => <div className={styles.divider} />;
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
	<p className={styles.sectionTitle}>{children}</p>
);

const toOptions = (values: string[] = []) =>
	values.map((v) => ({
		paramId: v,
		displayText:
			v.charAt(0).toUpperCase() + v.slice(1).toLowerCase().replace(/_/g, " "),
	}));

const FilterSidebar = () => {
	const { openPanel, close, filterEnums, makes } = useSidebarStore();
	const { get, set, clear } = useFilterParams();
	const isOpen = openPanel === "filter";

	return (
		<div className={`${styles.panel} ${isOpen ? styles.panelOpen : styles.panelClosed}`}>
			{/* Header */}
			<div className={styles.headerRow}>
				<button onClick={close} className={styles.closeBtn}>
					<BiX />
				</button>
				<h2 className={styles.panelTitle}>Filters</h2>
				<div className={styles.placeholder} />
			</div>

			{/* Scrollable content */}
			<div className={styles.scrollable}>
				<div className={styles.section}>
					<SectionTitle>Availability</SectionTitle>
					<PillSelect
						selected={get("availabilityFilter")}
						onChange={(v) => set({ availabilityFilter: v ?? undefined })}
						options={[
							{ paramId: "available", displayText: "Available only" },
							{ paramId: "hide_unavailable", displayText: "Hide unavailable" },
						]}
					/>
				</div>

				<Divider />

				{filterEnums && (
					<>
						<div className={styles.section}>
							<SectionTitle>Make</SectionTitle>
							<FilterBarDropdown
								label="Make"
								className="w-full"
								defaultValue={get("make")}
								onChange={(v) => set({ make: v ?? undefined })}
								options={(makes ?? []).map((m) => ({
									paramId: m,
									displayText: m,
								}))}
							/>
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

						<div className={styles.section}>
							<SectionTitle>Body type</SectionTitle>
							<PillSelect
								selected={get("bodyType")}
								onChange={(v) => set({ bodyType: v ?? undefined })}
								options={toOptions(filterEnums.bodyType)}
							/>
						</div>

						<Divider />

						<div className={styles.section}>
							<SectionTitle>Vehicle class</SectionTitle>
							<PillSelect
								selected={get("vehicleClass")}
								onChange={(v) => set({ vehicleClass: v ?? undefined })}
								options={toOptions(filterEnums.vehicleClass)}
							/>
						</div>

						<Divider />

						<div className={styles.section}>
							<SectionTitle>Roof type</SectionTitle>
							<PillSelect
								selected={get("roofType")}
								onChange={(v) => set({ roofType: v ?? undefined })}
								options={toOptions(filterEnums.roofType)}
							/>
						</div>

						<Divider />

						<div className={styles.section}>
							<SectionTitle>Drivetrain</SectionTitle>
							<div className={styles.grid2}>
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

						<div className={styles.perfSection}>
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
					</>
				)}
			</div>

			{/* Footer */}
			<div className={styles.footer}>
				<button
					onClick={() => {
						clear();
						close();
					}}
					className={styles.clearBtn}
				>
					Clear all
				</button>
				<button onClick={close} className={styles.showBtn}>
					Show results
				</button>
			</div>
		</div>
	);
};

export default FilterSidebar;
