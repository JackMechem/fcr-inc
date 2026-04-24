"use client";

import { useSidebarStore } from "@/stores/sidebarStore";
import { useFilterParams } from "@/app/browse/components/filters/useFilterParams";
import FilterBarNumberRangeInline from "@/app/browse/components/filters/filterBarNumberRangeInline";
import PillSelect from "@/app/browse/components/filters/pillSelect";
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
	const { get, getArray, set, clear } = useFilterParams();
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
							<PillSelect
								selectedValues={getArray("make")}
								onChangeMulti={(v) => set({ make: v.length ? v.join(",") : undefined })}
								options={(makes ?? []).map((m) => ({ paramId: m, displayText: m }))}
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
								selectedValues={getArray("bodyType")}
								onChangeMulti={(v) => set({ bodyType: v.length ? v : undefined })}
								options={toOptions(filterEnums.bodyType)}
							/>
						</div>

						<Divider />

						<div className={styles.section}>
							<SectionTitle>Vehicle class</SectionTitle>
							<PillSelect
								selectedValues={getArray("vehicleClass")}
								onChangeMulti={(v) => set({ vehicleClass: v.length ? v : undefined })}
								options={toOptions(filterEnums.vehicleClass)}
							/>
						</div>

						<Divider />

						<div className={styles.section}>
							<SectionTitle>Roof type</SectionTitle>
							<PillSelect
								selectedValues={getArray("roofType")}
								onChangeMulti={(v) => set({ roofType: v.length ? v : undefined })}
								options={toOptions(filterEnums.roofType)}
							/>
						</div>

						<Divider />

						<div className={styles.section}>
							<SectionTitle>Fuel</SectionTitle>
							<PillSelect
								selectedValues={getArray("fuel")}
								onChangeMulti={(v) => set({ fuel: v.length ? v : undefined })}
								options={toOptions(filterEnums.fuelType)}
							/>
						</div>

						<Divider />

						<div className={styles.section}>
							<SectionTitle>Transmission</SectionTitle>
							<PillSelect
								selectedValues={getArray("transmission")}
								onChangeMulti={(v) => set({ transmission: v.length ? v : undefined })}
								options={toOptions(filterEnums.transmissionType)}
							/>
						</div>

						<Divider />

						<div className={styles.section}>
							<SectionTitle>Drivetrain</SectionTitle>
							<PillSelect
								selectedValues={getArray("drivetrain")}
								onChangeMulti={(v) => set({ drivetrain: v.length ? v : undefined })}
								options={toOptions(filterEnums.drivetrain)}
							/>
						</div>

						<Divider />

						<div className={styles.section}>
							<SectionTitle>Engine layout</SectionTitle>
							<PillSelect
								selectedValues={getArray("engineLayout")}
								onChangeMulti={(v) => set({ engineLayout: v.length ? v : undefined })}
								options={toOptions(filterEnums.engineLayout)}
							/>
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
