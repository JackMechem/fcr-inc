"use client";

import { Car } from "@/app/types/CarTypes";
import { useEffect, useState } from "react";
import { addCar } from "../../lib/AdminApiCalls";
import { getCar, getFilteredCars } from "@/app/lib/CarApi";
import { useAdminSidebarStore } from "@/stores/adminSidebarStore";
import Cookies from "js-cookie";
import Image from "next/image";
import { BiCar, BiCheck, BiSearch, BiX, BiPlus } from "react-icons/bi";
import ReactMarkdown from "react-markdown";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CopyOption {
    vin: string;
    make: string;
    model: string;
    modelYear: number;
    images: string[];
    vehicleClass: string;
    pricePerDay: number;
}

interface CarFormPanelProps {
    mode: "add" | "edit";
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const BLANK: Partial<Car> = {
    vin: "", make: "", model: "", description: "",
    transmission: "AUTOMATIC", drivetrain: "AWD", engineLayout: "V",
    fuel: "GASOLINE", bodyType: "SEDAN", roofType: "HARDTOP", vehicleClass: "LUXURY",
    features: [], images: ["", "", "", "", ""],
};

const inputCls = "w-full bg-primary border border-third rounded-xl px-[14px] py-[10px] text-[10.5pt] text-foreground placeholder:text-foreground-light/60 focus:outline-none focus:border-accent/60 transition";
const selectCls = "w-full bg-primary border border-third rounded-xl px-[14px] py-[10px] text-[10.5pt] text-foreground focus:outline-none focus:border-accent/60 transition cursor-pointer";
const labelCls = "block text-[8pt] font-[600] uppercase tracking-wider text-foreground-light mb-[6px]";

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
        <label className={labelCls}>{label}</label>
        {children}
    </div>
);

const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-primary border border-third/60 rounded-2xl p-[20px] flex flex-col gap-[16px]">
        <p className="text-foreground text-[11pt] font-[600] pb-[4px] border-b border-third/50">{title}</p>
        {children}
    </div>
);

// ── Copy picker ───────────────────────────────────────────────────────────────

const CopyPicker = ({
    options,
    selectedVin,
    onSelect,
    mode,
}: {
    options: CopyOption[];
    selectedVin: string | null;
    onSelect: (vin: string | null) => void;
    mode: "add" | "edit";
}) => {
    const [query, setQuery] = useState("");

    const filtered = options
        .filter((o) => `${o.make} ${o.model} ${o.vin}`.toLowerCase().includes(query.toLowerCase()))
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
                    placeholder={mode === "edit" ? "Search for a vehicle to edit…" : "Search by make, model or VIN…"}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

            {/* Card strip */}
            <div className="flex gap-[12px] overflow-x-auto pb-[4px] scrollbar-hide">
                {filtered.length === 0 && (
                    <p className="text-foreground-light text-[10pt] py-[8px]">No vehicles found.</p>
                )}
                {filtered.map((car) => {
                    const isSelected = selectedVin === car.vin;
                    return (
                        <button
                            key={car.vin}
                            type="button"
                            onClick={() => onSelect(isSelected ? null : car.vin)}
                            className={`flex-shrink-0 w-[160px] rounded-xl overflow-hidden border-2 transition-all cursor-pointer text-left ${
                                isSelected ? "border-accent shadow-md shadow-accent/20" : "border-third hover:border-accent/40"
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
                                <p className="text-foreground text-[9.5pt] font-[600] truncate">{car.make} {car.model}</p>
                                <p className="text-foreground-light text-[8.5pt]">{car.modelYear}</p>
                                <p className="text-accent text-[8.5pt] font-[500] mt-[2px]">${car.pricePerDay}/day</p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// ── Markdown editor ───────────────────────────────────────────────────────────

const MarkdownEditor = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
    const [tab, setTab] = useState<"write" | "preview">("write");

    return (
        <div className="flex flex-col gap-0 rounded-xl overflow-hidden border border-third focus-within:border-accent/60 transition">
            {/* Tab bar */}
            <div className="flex border-b border-third bg-primary-dark/30">
                {(["write", "preview"] as const).map((t) => (
                    <button
                        key={t}
                        type="button"
                        onClick={() => setTab(t)}
                        className={`px-[16px] py-[8px] text-[9pt] font-[600] uppercase tracking-wider transition-colors cursor-pointer ${
                            tab === t
                                ? "text-accent border-b-2 border-accent -mb-[1px] bg-primary"
                                : "text-foreground-light hover:text-foreground"
                        }`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {/* Write */}
            {tab === "write" && (
                <textarea
                    className="w-full bg-primary px-[14px] py-[10px] text-[10.5pt] text-foreground placeholder:text-foreground-light/60 focus:outline-none resize-none h-[180px] font-mono"
                    placeholder="Describe the vehicle — supports **markdown**…"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
            )}

            {/* Preview */}
            {tab === "preview" && (
                <div className="min-h-[180px] px-[16px] py-[12px] bg-primary prose prose-sm prose-invert max-w-none
                    [&_h1]:text-foreground [&_h1]:text-[14pt] [&_h1]:font-[700] [&_h1]:mb-[8px]
                    [&_h2]:text-foreground [&_h2]:text-[12pt] [&_h2]:font-[600] [&_h2]:mb-[6px]
                    [&_h3]:text-foreground [&_h3]:text-[11pt] [&_h3]:font-[600]
                    [&_p]:text-foreground [&_p]:text-[10.5pt] [&_p]:leading-[1.6] [&_p]:mb-[8px]
                    [&_strong]:text-foreground [&_strong]:font-[600]
                    [&_em]:text-foreground-light
                    [&_ul]:text-foreground [&_ul]:list-disc [&_ul]:pl-[20px] [&_ul]:mb-[8px]
                    [&_ol]:text-foreground [&_ol]:list-decimal [&_ol]:pl-[20px] [&_ol]:mb-[8px]
                    [&_li]:text-[10.5pt] [&_li]:mb-[2px]
                    [&_a]:text-accent [&_a]:underline
                    [&_code]:bg-third/40 [&_code]:text-accent [&_code]:px-[6px] [&_code]:py-[1px] [&_code]:rounded [&_code]:text-[9.5pt]
                    [&_pre]:bg-third/40 [&_pre]:rounded-xl [&_pre]:p-[12px] [&_pre]:overflow-x-auto
                    [&_blockquote]:border-l-2 [&_blockquote]:border-accent/50 [&_blockquote]:pl-[12px] [&_blockquote]:text-foreground-light
                    [&_hr]:border-third/50">
                    {value.trim() ? (
                        <ReactMarkdown>{value}</ReactMarkdown>
                    ) : (
                        <p className="text-foreground-light/50 text-[10.5pt] italic">Nothing to preview yet.</p>
                    )}
                </div>
            )}
        </div>
    );
};

// ── Feature tag input ─────────────────────────────────────────────────────────

const FeatureTags = ({ features, onChange }: { features: string[]; onChange: (tags: string[]) => void }) => {
    const [input, setInput] = useState("");

    const add = () => {
        const trimmed = input.trim();
        if (trimmed && !features.includes(trimmed)) {
            onChange([...features, trimmed]);
        }
        setInput("");
    };

    const remove = (tag: string) => onChange(features.filter((f) => f !== tag));

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") { e.preventDefault(); add(); }
        if (e.key === "Backspace" && input === "" && features.length > 0) {
            remove(features[features.length - 1]);
        }
    };

    return (
        <div className="flex flex-col gap-[8px]">
            <label className={labelCls}>Features</label>
            <div className={`${inputCls} flex flex-wrap gap-[6px] items-center min-h-[44px] h-auto py-[8px] cursor-text`}
                onClick={(e) => (e.currentTarget.querySelector("input") as HTMLInputElement)?.focus()}
            >
                {features.map((tag) => (
                    <span key={tag} className="flex items-center gap-[4px] bg-accent/10 text-accent text-[9.5pt] font-[500] px-[10px] py-[3px] rounded-full">
                        {tag}
                        <button type="button" onClick={() => remove(tag)} className="cursor-pointer hover:text-accent/60 transition-colors leading-none">
                            <BiX className="text-[11pt]" />
                        </button>
                    </span>
                ))}
                <input
                    className="outline-none bg-transparent text-foreground text-[10.5pt] placeholder:text-foreground-light/60 flex-1 min-w-[140px]"
                    placeholder={features.length === 0 ? "e.g. Heated seats — press Enter to add" : "Add another…"}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={add}
                />
            </div>
        </div>
    );
};

// ── Main component ────────────────────────────────────────────────────────────

const CarFormPanel = ({ mode }: CarFormPanelProps) => {
    const { editVin, setEditVin } = useAdminSidebarStore();
    const [isLoading, setIsLoading] = useState(false);
    const [copyOptions, setCopyOptions] = useState<CopyOption[]>([]);
    const [selectedVin, setSelectedVin] = useState<string | null>(mode === "edit" ? editVin : null);
    const [submitted, setSubmitted] = useState(false);

    const [credentials] = useState(() => {
        const raw = Cookies.get("credentials");
        return raw ? JSON.parse(raw) : { username: "", password: "" };
    });

    const [form, setForm] = useState<Partial<Car>>(BLANK);

    // Fetch copy options with images
    useEffect(() => {
        getFilteredCars({ select: "vin,make,model,modelYear,images,vehicleClass,pricePerDay", pageSize: 200 })
            .then((res) => setCopyOptions(res.data as CopyOption[]))
            .catch(console.error);
        return () => { if (mode === "edit") setEditVin(null); };
    }, []);

    // Load selected car
    useEffect(() => {
        if (selectedVin) {
            getCar(selectedVin).then((car) => setForm(car)).catch(console.error);
        } else if (selectedVin === null && Object.keys(form).length > Object.keys(BLANK).length) {
            setForm(BLANK);
        }
    }, [selectedVin]);

    const set = (key: keyof Car, value: string | number | string[] | undefined) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const numVal = (key: keyof Car) => (form[key] !== undefined ? String(form[key]) : "");

    const handleNum = (key: keyof Car, raw: string) =>
        set(key, raw === "" ? undefined : Number(raw));

    const handleArray = (key: "features" | "images", raw: string) =>
        set(key, raw.split(",").map((s) => s.trim()).filter(Boolean));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await addCar(form as Car, credentials.username, credentials.password);
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

    const isValidUrl = (url: string) => { try { new URL(url); return true; } catch { return false; } };
    const previewImages = (form.images ?? []).filter((url) => url.trim() !== "");
    const validPreviewImages = previewImages.filter(isValidUrl);
    const filledImageCount = validPreviewImages.length;
    const MIN_IMAGES = 5;

    return (
        <div className="flex flex-col gap-[20px] pb-[40px]">
            {/* Copy picker */}
            <CopyPicker
                options={copyOptions}
                selectedVin={selectedVin}
                onSelect={setSelectedVin}
                mode={mode}
            />

            {/* In edit mode, only show the form once a vehicle is selected */}
            {mode === "edit" && !selectedVin && (
                <div className="flex items-center justify-center py-[60px] text-foreground-light text-[11pt]">
                    Select a vehicle above to start editing.
                </div>
            )}

            {/* Form */}
            {(mode === "add" || selectedVin) && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-[16px]">

                {/* Identity */}
                <SectionCard title="Identity">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-[12px]">
                        <Field label="VIN">
                            <input
                                className={`${inputCls} ${mode === "edit" ? "opacity-50 cursor-not-allowed" : ""}`}
                                placeholder="e.g. 1HGBH41JXMN109186"
                                value={form.vin ?? ""}
                                onChange={(e) => set("vin", e.target.value)}
                                readOnly={mode === "edit"}
                                required
                            />
                        </Field>
                        <Field label="Make">
                            <input className={inputCls} placeholder="e.g. Toyota" value={form.make ?? ""} onChange={(e) => set("make", e.target.value)} required />
                        </Field>
                        <Field label="Model">
                            <input className={inputCls} placeholder="e.g. Supra" value={form.model ?? ""} onChange={(e) => set("model", e.target.value)} required />
                        </Field>
                        <Field label="Year">
                            <input type="number" className={inputCls} placeholder="e.g. 2024" value={numVal("modelYear")} onChange={(e) => handleNum("modelYear", e.target.value)} />
                        </Field>
                    </div>
                </SectionCard>

                {/* Pricing & Specs */}
                <SectionCard title="Pricing & Specs">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-[12px]">
                        <Field label="Price / Day ($)">
                            <input type="number" className={inputCls} placeholder="e.g. 299" value={numVal("pricePerDay")} onChange={(e) => handleNum("pricePerDay", e.target.value)} />
                        </Field>
                        <Field label="MPG">
                            <input type="number" className={inputCls} placeholder="e.g. 30" value={numVal("mpg")} onChange={(e) => handleNum("mpg", e.target.value)} />
                        </Field>
                        <Field label="Seats">
                            <input type="number" className={inputCls} placeholder="e.g. 4" value={numVal("seats")} onChange={(e) => handleNum("seats", e.target.value)} />
                        </Field>
                        <Field label="Fuel">
                            <select className={selectCls} value={form.fuel ?? "GASOLINE"} onChange={(e) => set("fuel", e.target.value)}>
                                <option value="GASOLINE">Gasoline</option>
                                <option value="DIESEL">Diesel</option>
                                <option value="ELECTRIC">Electric</option>
                                <option value="HYBRID">Hybrid</option>
                            </select>
                        </Field>
                    </div>
                </SectionCard>

                {/* Performance */}
                <SectionCard title="Performance">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-[12px]">
                        <Field label="Horsepower (hp)">
                            <input type="number" className={inputCls} placeholder="e.g. 500" value={numVal("horsepower")} onChange={(e) => handleNum("horsepower", e.target.value)} />
                        </Field>
                        <Field label="Torque (lb-ft)">
                            <input type="number" className={inputCls} placeholder="e.g. 450" value={numVal("torque")} onChange={(e) => handleNum("torque", e.target.value)} />
                        </Field>
                        <Field label="Cylinders">
                            <input type="number" className={inputCls} placeholder="e.g. 6" value={numVal("cylinders")} onChange={(e) => handleNum("cylinders", e.target.value)} />
                        </Field>
                        <Field label="Gears">
                            <input type="number" className={inputCls} placeholder="e.g. 8" value={numVal("gears")} onChange={(e) => handleNum("gears", e.target.value)} />
                        </Field>
                    </div>
                </SectionCard>

                {/* Configuration & Classification */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
                    <SectionCard title="Configuration">
                        <Field label="Transmission">
                            <select className={selectCls} value={form.transmission ?? "AUTOMATIC"} onChange={(e) => set("transmission", e.target.value)}>
                                <option value="AUTOMATIC">Automatic</option>
                                <option value="MANUAL">Manual</option>
                            </select>
                        </Field>
                        <Field label="Drivetrain">
                            <select className={selectCls} value={form.drivetrain ?? "AWD"} onChange={(e) => set("drivetrain", e.target.value)}>
                                <option value="AWD">AWD</option>
                                <option value="RWD">RWD</option>
                                <option value="FWD">FWD</option>
                            </select>
                        </Field>
                        <Field label="Engine Layout">
                            <select className={selectCls} value={form.engineLayout ?? "V"} onChange={(e) => set("engineLayout", e.target.value)}>
                                <option value="V">V</option>
                                <option value="INLINE">Inline</option>
                                <option value="FLAT">Flat</option>
                                <option value="SINGLE_MOTOR">Single Motor</option>
                                <option value="DUAL_MOTOR">Dual Motor</option>
                            </select>
                        </Field>
                    </SectionCard>

                    <SectionCard title="Classification">
                        <Field label="Body Type">
                            <select className={selectCls} value={form.bodyType ?? "SEDAN"} onChange={(e) => set("bodyType", e.target.value)}>
                                <option value="SEDAN">Sedan</option>
                                <option value="SUV">SUV</option>
                                <option value="TRUCK">Truck</option>
                                <option value="CONVERTIBLE">Convertible</option>
                                <option value="HATCHBACK">Hatchback</option>
                                <option value="FULL_SIZE">Full Size</option>
                                <option value="COMPACT">Compact</option>
                                <option value="WAGON">Wagon</option>
                                <option value="ELECTRIC">Electric</option>
                                <option value="COUPE">Coupe</option>
                            </select>
                        </Field>
                        <Field label="Roof Type">
                            <select className={selectCls} value={form.roofType ?? "HARDTOP"} onChange={(e) => set("roofType", e.target.value)}>
                                <option value="HARDTOP">Hard Top</option>
                                <option value="SOFTTOP">Soft Top</option>
                                <option value="TARGA">Targa</option>
                                <option value="SLICKTOP">Slicktop</option>
                                <option value="PANORAMIC">Panoramic</option>
                            </select>
                        </Field>
                        <Field label="Vehicle Class">
                            <select className={selectCls} value={form.vehicleClass ?? "LUXURY"} onChange={(e) => set("vehicleClass", e.target.value)}>
                                <option value="ECONOMY">Economy</option>
                                <option value="LUXURY">Luxury</option>
                                <option value="PERFORMANCE">Performance</option>
                                <option value="OFFROAD">Off Road</option>
                                <option value="FULL_SIZE">Full Size</option>
                                <option value="ELECTRIC">Electric</option>
                            </select>
                        </Field>
                    </SectionCard>
                </div>

                {/* Description */}
                <SectionCard title="Description">
                    <MarkdownEditor
                        value={form.description ?? ""}
                        onChange={(v) => set("description", v)}
                    />
                </SectionCard>

                {/* Media & Features */}
                <SectionCard title="Media & Features">
                    <FeatureTags
                        features={form.features ?? []}
                        onChange={(tags) => set("features", tags)}
                    />
                    <div className="flex flex-col gap-[8px]">
                        <div className="flex items-center justify-between">
                            <label className={labelCls}>Image URLs</label>
                            <span className={`text-[8.5pt] font-[500] ${filledImageCount >= MIN_IMAGES ? "text-accent" : "text-amber-400"}`}>
                                {filledImageCount} / {MIN_IMAGES} required
                            </span>
                        </div>
                        {(form.images ?? [""]).map((url, i) => (
                            <div key={i} className="flex gap-[8px] items-center">
                                <input
                                    className={`${inputCls} flex-1`}
                                    placeholder="https://…"
                                    value={url}
                                    onChange={(e) => {
                                        const updated = [...(form.images ?? [])];
                                        updated[i] = e.target.value;
                                        set("images", updated);
                                    }}
                                />
                                {(form.images ?? []).length > MIN_IMAGES && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const updated = (form.images ?? []).filter((_, j) => j !== i);
                                            set("images", updated);
                                        }}
                                        className="flex-shrink-0 w-[36px] h-[36px] flex items-center justify-center rounded-xl border border-third text-foreground-light hover:border-red-400/60 hover:text-red-400 transition-colors cursor-pointer"
                                    >
                                        <BiX className="text-[14pt]" />
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => set("images", [...(form.images ?? []), ""])}
                            className="flex items-center gap-[6px] px-[12px] py-[8px] rounded-xl border border-dashed border-third hover:border-accent/50 hover:bg-accent/5 text-foreground-light hover:text-accent text-[10pt] transition-colors cursor-pointer w-fit"
                        >
                            <BiPlus className="text-[13pt]" /> Add Image
                        </button>
                    </div>

                    {/* Image preview */}
                    {validPreviewImages.length > 0 && (
                        <div className="flex gap-[10px] overflow-x-auto pb-[4px] scrollbar-hide">
                            {validPreviewImages.map((url, i) => (
                                <div key={i} className="relative flex-shrink-0 w-[120px] h-[80px] rounded-xl overflow-hidden border border-third bg-third/20">
                                    <Image src={url} alt={`preview ${i + 1}`} fill className="object-cover" sizes="120px"
                                        onError={(e) => (e.currentTarget.style.display = "none")} />
                                </div>
                            ))}
                        </div>
                    )}
                </SectionCard>

                {/* Submit */}
                {filledImageCount < MIN_IMAGES && (
                    <p className="text-amber-400 text-[9.5pt] text-center">
                        Add at least {MIN_IMAGES} image URLs before saving ({MIN_IMAGES - filledImageCount} more needed).
                    </p>
                )}
                <button
                    type="submit"
                    disabled={isLoading || filledImageCount < MIN_IMAGES}
                    className="w-full py-[14px] bg-accent text-primary font-[600] text-[11pt] rounded-xl hover:brightness-110 transition disabled:opacity-50 cursor-pointer"
                >
                    {isLoading ? "Saving…" : submitted ? "✓ Saved!" : mode === "edit" ? "Overwrite Vehicle" : "Add Vehicle to Fleet"}
                </button>
            </form>
            )}
        </div>
    );
};

export default CarFormPanel;
