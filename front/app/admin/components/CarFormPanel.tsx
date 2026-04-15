"use client";

import { Car } from "@/app/types/CarTypes";
import { CarEnums } from "@/app/types/CarEnums";
import { useEffect, useState } from "react";
import { addCar, editCar, getCarAdmin, getFilteredCarsAdmin } from "@/app/lib/AdminApiCalls";
import { useAdminSidebarStore } from "@/stores/adminSidebarStore";
import { callGemini } from "@/app/lib/gemini";
import { formatEnum } from "@/app/lib/formatEnum";
import Image from "next/image";
import { BiX, BiPlus } from "react-icons/bi";

import AiButton from "./form/AiButton";
import Field, { formStyles } from "./form/Field";
import SectionCard from "./form/SectionCard";
import CopyPicker, { CopyOption } from "./form/CopyPicker";
import MarkdownEditor from "./form/MarkdownEditor";
import FeatureTags from "./form/FeatureTags";

// ── Constants ─────────────────────────────────────────────────────────────────

const BLANK: Partial<Car> = {
	vin: "",
	make: "",
	model: "",
	description: "",
	transmission: "AUTOMATIC",
	drivetrain: "AWD",
	engineLayout: "V",
	fuel: "GASOLINE",
	bodyType: "SEDAN",
	roofType: "HARDTOP",
	vehicleClass: "LUXURY",
	features: [],
	images: ["", "", "", "", ""],
};

const MIN_IMAGES = 5;

// ── Main component ────────────────────────────────────────────────────────────

interface CarFormPanelProps {
	mode: "add" | "edit";
}

const CarFormPanel = ({ mode }: CarFormPanelProps) => {
	const { editVin, setEditVin } = useAdminSidebarStore();
	const [isLoading, setIsLoading] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const [copyOptions, setCopyOptions] = useState<CopyOption[]>([]);
	const [selectedVin, setSelectedVin] = useState<string | null>(
		mode === "edit" ? editVin : null,
	);
	const [enums, setEnums] = useState<CarEnums | null>(null);
	const [form, setForm] = useState<Partial<Car>>(BLANK);
	const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});

	useEffect(() => {
		getFilteredCarsAdmin({
			select: "vin,make,model,modelYear,images,vehicleClass,pricePerDay",
			pageSize: 200,
		})
			.then((res) => setCopyOptions(res.data as CopyOption[]))
			.catch(console.error);

		fetch("/api/enums")
			.then((r) => r.json())
			.then(setEnums)
			.catch(console.error);

		return () => {
			if (mode === "edit") setEditVin(null);
		};
	}, []);

	useEffect(() => {
		if (selectedVin) {
			getCarAdmin(selectedVin).then((car) => setForm(car)).catch(console.error);
		} else if (selectedVin === null && Object.keys(form).length > Object.keys(BLANK).length) {
			setForm(BLANK);
		}
	}, [selectedVin]);

	const setField = (key: keyof Car, value: string | number | string[] | undefined) =>
		setForm((prev) => ({ ...prev, [key]: value }));

	const numVal = (key: keyof Car) =>
		form[key] !== undefined ? String(form[key]) : "";

	const handleNum = (key: keyof Car, raw: string) =>
		setField(key, raw === "" ? undefined : Number(raw));

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		try {
			if (mode === "add") {
				await addCar(form as Car);
			} else {
				await editCar(form as Car);
			}
			setSubmitted(true);
			setForm(BLANK);
			setSelectedVin(null);
			setTimeout(() => setSubmitted(false), 3000);
		} catch (error) {
			alert("Error: " + error);
		} finally {
			setIsLoading(false);
		}
	};

	const setAiField = (field: string, loading: boolean) =>
		setAiLoading((prev) => ({ ...prev, [field]: loading }));

	const vehicleCtx =
		`${form.modelYear ?? ""} ${form.make ?? ""} ${form.model ?? ""}`.trim() || "a vehicle";

	const fillField = async (
		field: keyof Car,
		prompt: string,
		parse: (s: string) => string | number | string[] = (s) => s.trim(),
	) => {
		const key = String(field);
		setAiField(key, true);
		try {
			const raw = await callGemini(prompt);
			setField(field, parse(raw));
		} catch (e) {
			alert("AI error: " + e);
		} finally {
			setAiField(key, false);
		}
	};

	const fillFeatures = async () => {
		setAiField("features", true);
		try {
			const raw = await callGemini(
				`List 6–10 notable features of a ${vehicleCtx} as a JSON array of short strings (e.g. ["Heated seats","Blind spot monitoring"]). Reply with only the JSON array, no extra text.`,
			);
			const match = raw.match(/\[[\s\S]*\]/);
			const tags: string[] = match ? JSON.parse(match[0]) : [];
			setField("features", tags);
		} catch (e) {
			alert("AI error: " + e);
		} finally {
			setAiField("features", false);
		}
	};

	const fillSectionJson = async (
		key: string,
		prompt: string,
		apply: (parsed: Record<string, unknown>) => void,
	) => {
		setAiField(key, true);
		try {
			const raw = await callGemini(prompt);
			const match = raw.match(/\{[\s\S]*\}/);
			if (match) apply(JSON.parse(match[0]));
		} catch (e) {
			alert("AI error: " + e);
		} finally {
			setAiField(key, false);
		}
	};

	const fillPricingSpecs = () =>
		fillSectionJson(
			"section_pricing",
			`For a ${vehicleCtx}, return a JSON object with exactly these keys:
- pricePerDay: rental price per day USD (whole number)
- mpg: typical combined MPG (whole number, 0 for electric)
- seats: number of seats (whole number)
- fuel: one of ${(enums?.fuelType ?? ["GASOLINE", "DIESEL", "ELECTRIC", "HYBRID"]).join(", ")}
Reply with only the JSON object, no extra text.`,
			(p) =>
				setForm((prev) => ({
					...prev,
					...(p.pricePerDay != null ? { pricePerDay: Number(p.pricePerDay) } : {}),
					...(p.mpg != null ? { mpg: Number(p.mpg) } : {}),
					...(p.seats != null ? { seats: Number(p.seats) } : {}),
					...(p.fuel ? { fuel: String(p.fuel) } : {}),
				})),
		);

	const fillPerformance = () =>
		fillSectionJson(
			"section_performance",
			`For a ${vehicleCtx}, return a JSON object with exactly these keys:
- horsepower: horsepower (whole number)
- torque: torque in lb-ft (whole number)
- cylinders: number of cylinders (whole number, 0 for electric)
- gears: number of transmission gears (whole number)
Reply with only the JSON object, no extra text.`,
			(p) =>
				setForm((prev) => ({
					...prev,
					...(p.horsepower != null ? { horsepower: Number(p.horsepower) } : {}),
					...(p.torque != null ? { torque: Number(p.torque) } : {}),
					...(p.cylinders != null ? { cylinders: Number(p.cylinders) } : {}),
					...(p.gears != null ? { gears: Number(p.gears) } : {}),
				})),
		);

	const fillConfiguration = () =>
		fillSectionJson(
			"section_configuration",
			`For a ${vehicleCtx}, return a JSON object with exactly these keys:
- transmission: one of ${(enums?.transmissionType ?? ["AUTOMATIC", "MANUAL"]).join(", ")}
- drivetrain: one of ${(enums?.drivetrain ?? ["AWD", "RWD", "FWD"]).join(", ")}
- engineLayout: one of ${(enums?.engineLayout ?? ["V", "INLINE", "FLAT", "SINGLE_MOTOR", "DUAL_MOTOR"]).join(", ")}
Reply with only the JSON object, no extra text.`,
			(p) =>
				setForm((prev) => ({
					...prev,
					...(p.transmission ? { transmission: String(p.transmission) } : {}),
					...(p.drivetrain ? { drivetrain: String(p.drivetrain) } : {}),
					...(p.engineLayout ? { engineLayout: String(p.engineLayout) } : {}),
				})),
		);

	const fillClassification = () =>
		fillSectionJson(
			"section_classification",
			`For a ${vehicleCtx}, return a JSON object with exactly these keys:
- bodyType: one of ${(enums?.bodyType ?? ["SEDAN", "SUV", "TRUCK", "CONVERTIBLE", "HATCHBACK", "FULL_SIZE", "COMPACT", "WAGON", "ELECTRIC", "COUPE"]).join(", ")}
- roofType: one of ${(enums?.roofType ?? ["HARDTOP", "SOFTTOP", "TARGA", "SLICKTOP", "PANORAMIC"]).join(", ")}
- vehicleClass: one of ${(enums?.vehicleClass ?? ["ECONOMY", "LUXURY", "PERFORMANCE", "OFFROAD", "FULL_SIZE", "ELECTRIC"]).join(", ")}
Reply with only the JSON object, no extra text.`,
			(p) =>
				setForm((prev) => ({
					...prev,
					...(p.bodyType ? { bodyType: String(p.bodyType) } : {}),
					...(p.roofType ? { roofType: String(p.roofType) } : {}),
					...(p.vehicleClass ? { vehicleClass: String(p.vehicleClass) } : {}),
				})),
		);

	const isValidUrl = (url: string) => {
		try { new URL(url); return true; } catch { return false; }
	};
	const validPreviewImages = (form.images ?? []).filter(
		(url) => url.trim() !== "" && isValidUrl(url),
	);
	const filledImageCount = validPreviewImages.length;

	return (
		<div className={formStyles.formRoot}>
			<CopyPicker
				options={copyOptions}
				selectedVin={selectedVin}
				onSelect={setSelectedVin}
				mode={mode}
			/>

			{mode === "edit" && !selectedVin && (
				<div className={formStyles.formNoVehicle}>
					Select a vehicle above to start editing.
				</div>
			)}

			{(mode === "add" || selectedVin) && (
				<form onSubmit={handleSubmit} className={formStyles.formRoot}>

					{/* Identity */}
					<SectionCard title="Identity">
						<div className={formStyles.formGrid2x4}>
							<Field label="VIN">
								<input
									className={`${formStyles.input} ${mode === "edit" ? formStyles.inputDisabled : ""}`}
									placeholder="e.g. 1HGBH41JXMN109186"
									value={form.vin ?? ""}
									onChange={(e) => setField("vin", e.target.value)}
									readOnly={mode === "edit"}
									required
								/>
							</Field>
							<Field label="Make">
								<input className={formStyles.input} placeholder="e.g. Toyota" value={form.make ?? ""} onChange={(e) => setField("make", e.target.value)} required />
							</Field>
							<Field label="Model">
								<input className={formStyles.input} placeholder="e.g. Supra" value={form.model ?? ""} onChange={(e) => setField("model", e.target.value)} required />
							</Field>
							<Field label="Year">
								<input type="number" className={formStyles.input} placeholder="e.g. 2024" value={numVal("modelYear")} onChange={(e) => handleNum("modelYear", e.target.value)} />
							</Field>
						</div>
					</SectionCard>

					{/* Pricing & Specs */}
					<SectionCard title="Pricing & Specs" action={<AiButton loading={!!aiLoading["section_pricing"]} onClick={fillPricingSpecs} />}>
						<div className={formStyles.formGrid2x4}>
							<Field label="Price / Day ($)">
								<input type="number" className={formStyles.input} placeholder="e.g. 299" value={numVal("pricePerDay")} onChange={(e) => handleNum("pricePerDay", e.target.value)} />
							</Field>
							<Field label="MPG">
								<input type="number" className={formStyles.input} placeholder="e.g. 30" value={numVal("mpg")} onChange={(e) => handleNum("mpg", e.target.value)} />
							</Field>
							<Field label="Seats">
								<input type="number" className={formStyles.input} placeholder="e.g. 4" value={numVal("seats")} onChange={(e) => handleNum("seats", e.target.value)} />
							</Field>
							<Field label="Fuel">
								<select className={formStyles.select} value={form.fuel ?? "GASOLINE"} onChange={(e) => setField("fuel", e.target.value)}>
									{(enums?.fuelType ?? ["GASOLINE", "DIESEL", "ELECTRIC", "HYBRID"]).map((v) => (
										<option key={v} value={v}>{formatEnum(v)}</option>
									))}
								</select>
							</Field>
						</div>
					</SectionCard>

					{/* Performance */}
					<SectionCard title="Performance" action={<AiButton loading={!!aiLoading["section_performance"]} onClick={fillPerformance} />}>
						<div className={formStyles.formGrid2x4}>
							<Field label="Horsepower (hp)">
								<input type="number" className={formStyles.input} placeholder="e.g. 500" value={numVal("horsepower")} onChange={(e) => handleNum("horsepower", e.target.value)} />
							</Field>
							<Field label="Torque (lb-ft)">
								<input type="number" className={formStyles.input} placeholder="e.g. 450" value={numVal("torque")} onChange={(e) => handleNum("torque", e.target.value)} />
							</Field>
							<Field label="Cylinders">
								<input type="number" className={formStyles.input} placeholder="e.g. 6" value={numVal("cylinders")} onChange={(e) => handleNum("cylinders", e.target.value)} />
							</Field>
							<Field label="Gears">
								<input type="number" className={formStyles.input} placeholder="e.g. 8" value={numVal("gears")} onChange={(e) => handleNum("gears", e.target.value)} />
							</Field>
						</div>
					</SectionCard>

					{/* Configuration & Classification */}
					<div className={formStyles.formGrid1x2}>
						<SectionCard title="Configuration" action={<AiButton loading={!!aiLoading["section_configuration"]} onClick={fillConfiguration} />}>
							<Field label="Transmission">
								<select className={formStyles.select} value={form.transmission ?? "AUTOMATIC"} onChange={(e) => setField("transmission", e.target.value)}>
									{(enums?.transmissionType ?? ["AUTOMATIC", "MANUAL"]).map((v) => (
										<option key={v} value={v}>{formatEnum(v)}</option>
									))}
								</select>
							</Field>
							<Field label="Drivetrain">
								<select className={formStyles.select} value={form.drivetrain ?? "AWD"} onChange={(e) => setField("drivetrain", e.target.value)}>
									{(enums?.drivetrain ?? ["AWD", "RWD", "FWD"]).map((v) => (
										<option key={v} value={v}>{formatEnum(v)}</option>
									))}
								</select>
							</Field>
							<Field label="Engine Layout">
								<select className={formStyles.select} value={form.engineLayout ?? "V"} onChange={(e) => setField("engineLayout", e.target.value)}>
									{(enums?.engineLayout ?? ["V", "INLINE", "FLAT", "SINGLE_MOTOR", "DUAL_MOTOR"]).map((v) => (
										<option key={v} value={v}>{formatEnum(v)}</option>
									))}
								</select>
							</Field>
						</SectionCard>

						<SectionCard title="Classification" action={<AiButton loading={!!aiLoading["section_classification"]} onClick={fillClassification} />}>
							<Field label="Body Type">
								<select className={formStyles.select} value={form.bodyType ?? "SEDAN"} onChange={(e) => setField("bodyType", e.target.value)}>
									{(enums?.bodyType ?? ["SEDAN", "SUV", "TRUCK", "CONVERTIBLE", "HATCHBACK", "FULL_SIZE", "COMPACT", "WAGON", "ELECTRIC", "COUPE"]).map((v) => (
										<option key={v} value={v}>{formatEnum(v)}</option>
									))}
								</select>
							</Field>
							<Field label="Roof Type">
								<select className={formStyles.select} value={form.roofType ?? "HARDTOP"} onChange={(e) => setField("roofType", e.target.value)}>
									{(enums?.roofType ?? ["HARDTOP", "SOFTTOP", "TARGA", "SLICKTOP", "PANORAMIC"]).map((v) => (
										<option key={v} value={v}>{formatEnum(v)}</option>
									))}
								</select>
							</Field>
							<Field label="Vehicle Class">
								<select className={formStyles.select} value={form.vehicleClass ?? "LUXURY"} onChange={(e) => setField("vehicleClass", e.target.value)}>
									{(enums?.vehicleClass ?? ["ECONOMY", "LUXURY", "PERFORMANCE", "OFFROAD", "FULL_SIZE", "ELECTRIC"]).map((v) => (
										<option key={v} value={v}>{formatEnum(v)}</option>
									))}
								</select>
							</Field>
						</SectionCard>
					</div>

					{/* Description */}
					<SectionCard title="Description">
						<div className={formStyles.descriptionActions}>
							<AiButton
								loading={!!aiLoading["description"]}
								onClick={() =>
									fillField(
										"description",
										`Write a compelling 2-3 paragraph markdown description with titles, subtitles, and maybe bullets for renting a ${vehicleCtx} at a luxury car rental company. Highlight performance, comfort, and what makes it special. Use **bold** for emphasis where appropriate. Reply with only the description text in markdown format.`,
									)
								}
							/>
						</div>
						<MarkdownEditor
							value={form.description ?? ""}
							onChange={(v) => setField("description", v)}
						/>
					</SectionCard>

					{/* Media & Features */}
					<SectionCard title="Media & Features">
						<div className={formStyles.sectionCardHeader}>
							<label className={formStyles.label}>Features</label>
							<AiButton loading={!!aiLoading["features"]} onClick={fillFeatures} />
						</div>
						<FeatureTags
							features={form.features ?? []}
							onChange={(tags) => setField("features", tags)}
						/>

						<div className={formStyles.imageRowGroup}>
							<div className={formStyles.sectionCardHeader}>
								<label className={formStyles.label}>Image URLs</label>
								<span className={`${formStyles.imageCountNote} ${filledImageCount >= MIN_IMAGES ? formStyles.imageCountOk : formStyles.imageCountWarn}`}>
									{filledImageCount} / {MIN_IMAGES} required
								</span>
							</div>
							{(form.images ?? [""]).map((url, i) => (
								<div key={i} className={formStyles.imageRow}>
									<input
										className={`${formStyles.input} ${formStyles.imageRowInput}`}
										placeholder="https://…"
										value={url}
										onChange={(e) => {
											const updated = [...(form.images ?? [])];
											updated[i] = e.target.value;
											setField("images", updated);
										}}
									/>
									{(form.images ?? []).length > MIN_IMAGES && (
										<button
											type="button"
											onClick={() => {
												const updated = (form.images ?? []).filter((_, j) => j !== i);
												setField("images", updated);
											}}
											className={formStyles.imageRemoveBtn}
										>
											<BiX />
										</button>
									)}
								</div>
							))}
							<button
								type="button"
								onClick={() => setField("images", [...(form.images ?? []), ""])}
								className={formStyles.addImageBtn}
							>
								<BiPlus className={formStyles.addImageIcon} /> Add Image
							</button>
						</div>

						{validPreviewImages.length > 0 && (
							<div className={`${formStyles.imagePreviewStrip} scrollbar-hide`}>
								{validPreviewImages.map((url, i) => (
									<div key={i} className={formStyles.imagePreviewThumb}>
										<Image
											src={url}
											alt={`preview ${i + 1}`}
											fill
											className="object-cover"
											sizes="120px"
											onError={(e) => (e.currentTarget.style.display = "none")}
										/>
									</div>
								))}
							</div>
						)}
					</SectionCard>

					{filledImageCount < MIN_IMAGES && (
						<p className={formStyles.formWarning}>
							Add at least {MIN_IMAGES} image URLs before saving (
							{MIN_IMAGES - filledImageCount} more needed).
						</p>
					)}
					<button
						type="submit"
						disabled={isLoading || filledImageCount < MIN_IMAGES}
						className={formStyles.submitBtn}
					>
						{isLoading
							? "Saving…"
							: submitted
								? "✓ Saved!"
								: mode === "edit"
									? "Overwrite Vehicle"
									: "Add Vehicle to Fleet"}
					</button>
				</form>
			)}
		</div>
	);
};

export default CarFormPanel;
