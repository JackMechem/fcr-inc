"use client";

import { Car } from "@/app/types/CarTypes";
import { useEffect, useState } from "react";
import { addCar, getAllCars, deleteCar, getCarAdmin, getFilteredCarsAdmin } from "@/app/lib/AdminApiCalls";
import NavHeader from "@/app/components/headers/navHeader";

interface ICopyOptions {
	vin: string;
	make: string;
	model: string;
}

const EditCarPage = () => {
	const [cars, setCars] = useState<Car[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [hasFetched, setHasFetched] = useState(false);
	const [copyCarVin, setCopyCarVin] = useState<string | null>(null);
	const [copyOptions, setCopyOptions] = useState<ICopyOptions[]>([]);

	const fetchCopyCarOptions = async () => {
		try {
			const carData = await getFilteredCarsAdmin({
				select: "vin,make,model",
				pageSize: 100,
			});
			setCopyOptions(carData.data);
		} catch (error) {
			alert("Fetch failed: " + error);
		}
	};

	useEffect(() => {
		fetchCopyCarOptions();
	}, []);

	const fetchFullCar = async (vin: string) => {
		const carData: Car = await getCarAdmin(vin);
		setFormData(carData);
	};

	useEffect(() => {
		if (copyCarVin) {
			fetchFullCar(copyCarVin);
		}
	}, [copyCarVin]);

	const [formData, setFormData] = useState<Partial<Car>>({
		vin: "",
		make: "",
		model: "",
		description: "",
		cylinders: 0,
		gears: 0,
		horsepower: 0,
		torque: 0,
		seats: 0,
		pricePerDay: 0,
		mpg: 0,
		modelYear: 2024,
		features: [],
		images: [],
		transmission: "AUTOMATIC",
		drivetrain: "AWD",
		engineLayout: "V",
		fuel: "GASOLINE",
		bodyType: "SEDAN",
		roofType: "HARDTOP",
		vehicleClass: "LUXURY",
	});

	const handleFetchData = async () => {
		setIsLoading(true);
		try {
			const carData = await getAllCars({ pageSize: 100 });
			setCars(carData.data);
			setHasFetched(true);
		} catch (error) {
			alert("Fetch failed: " + error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		try {
			// Casting to Car ensures all required fields from the interface are present
			await addCar(formData as Car);
			alert("Car added successfully!");
			handleFetchData(); // Refresh list after adding
		} catch (error) {
			alert("Error: " + error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleInputChange = (key: keyof Car, value: string | number) => {
		setFormData((prev) => ({ ...prev, [key]: value }));
	};

	const handleArrayChange = (key: "features" | "images", value: string) => {
		const arrayValue = value
			.split(",")
			.map((item) => item.trim())
			.filter((item) => item !== "");
		setFormData((prev) => ({ ...prev, [key]: arrayValue }));
	};

	return (
		<div className="mx-[20px]">
			<NavHeader white={false} />
			<div className="my-6">
				<label className="block text-xs font-bold uppercase text-slate-500 mb-2">
					Copy from Existing Vehicle
				</label>
				<select
					className="w-full max-w-md border border-slate-200 bg-white p-2.5 rounded-lg shadow-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition"
					value={copyCarVin ?? ""}
					onChange={(e) => setCopyCarVin(e.target.value || null)}
				>
					<option value="">— Select a vehicle to copy —</option>
					{copyOptions &&
						copyOptions.map((option) => (
							<option key={option.vin} value={option.vin}>
								{option.make} {option.model} · {option.vin}
							</option>
						))}
				</select>
			</div>
			<form
				onSubmit={handleSubmit}
				className="mt-8 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm"
			>
				<h3 className="text-xl font-bold mb-6 text-slate-800 border-b pb-2">
					Add New Vehicle
				</h3>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					{/* IDENTITY */}
					<div className="space-y-2">
						<label className="text-xs font-bold uppercase text-slate-500">
							Identity
						</label>
						<input
							placeholder="VIN"
							className="w-full border p-2 rounded-lg"
							value={formData.vin}
							onChange={(e) => handleInputChange("vin", e.target.value)}
							required
						/>
						<input
							placeholder="Make"
							className="w-full border p-2 rounded-lg"
							value={formData.make}
							onChange={(e) => handleInputChange("make", e.target.value)}
							required
						/>
						<input
							placeholder="Model"
							value={formData.model}
							className="w-full border p-2 rounded-lg"
							onChange={(e) => handleInputChange("model", e.target.value)}
							required
						/>
						<input
							type="number"
							placeholder="Year"
							className="w-full border p-2 rounded-lg"
							value={formData.modelYear}
							onChange={(e) =>
								handleInputChange("modelYear", Number(e.target.value))
							}
						/>
					</div>

					{/* PERFORMANCE */}
					<div className="space-y-2">
						<label className="text-xs font-bold uppercase text-slate-500">
							Performance
						</label>
						<input
							type="number"
							placeholder="Horsepower"
							className="w-full border p-2 rounded-lg"
							value={formData.horsepower}
							onChange={(e) =>
								handleInputChange("horsepower", Number(e.target.value))
							}
						/>
						<input
							type="number"
							placeholder="Torque"
							className="w-full border p-2 rounded-lg"
							value={formData.torque}
							onChange={(e) =>
								handleInputChange("torque", Number(e.target.value))
							}
						/>
						<input
							type="number"
							placeholder="Cylinders"
							className="w-full border p-2 rounded-lg"
							value={formData.cylinders}
							onChange={(e) =>
								handleInputChange("cylinders", Number(e.target.value))
							}
						/>
						<input
							type="number"
							placeholder="Gears"
							value={formData.gears}
							className="w-full border p-2 rounded-lg"
							onChange={(e) =>
								handleInputChange("gears", Number(e.target.value))
							}
						/>
					</div>

					{/* SPECS & PRICING */}
					<div className="space-y-2">
						<label className="text-xs font-bold uppercase text-slate-500">
							Specs & Pricing
						</label>
						<input
							type="number"
							placeholder="Price Per Day"
							className="w-full border p-2 rounded-lg"
							value={formData.pricePerDay}
							onChange={(e) =>
								handleInputChange("pricePerDay", Number(e.target.value))
							}
						/>
						<input
							type="number"
							placeholder="MPG"
							className="w-full border p-2 rounded-lg"
							value={formData.mpg}
							onChange={(e) => handleInputChange("mpg", Number(e.target.value))}
						/>
						<input
							type="number"
							placeholder="Seats"
							className="w-full border p-2 rounded-lg"
							value={formData.seats}
							onChange={(e) =>
								handleInputChange("seats", Number(e.target.value))
							}
						/>
						<select
							className="w-full border p-2 rounded-lg"
							value={formData.fuel}
							onChange={(e) => handleInputChange("fuel", e.target.value)}
						>
							<option value="GASOLINE">Gasoline</option>
							<option value="DIESEL">Diesel</option>
							<option value="ELECTRIC">Electric</option>
							<option value="HYBRID">Hybrid</option>
						</select>
					</div>

					{/* CONFIGURATION */}
					<div className="space-y-2">
						<label className="text-xs font-bold uppercase text-slate-500">
							Configuration
						</label>
						<select
							className="w-full border p-2 rounded-lg"
							value={formData.transmission}
							onChange={(e) =>
								handleInputChange("transmission", e.target.value)
							}
						>
							<option value="AUTOMATIC">Automatic</option>
							<option value="MANUAL">Manual</option>
						</select>
						<select
							className="w-full border p-2 rounded-lg"
							value={formData.drivetrain}
							onChange={(e) => handleInputChange("drivetrain", e.target.value)}
						>
							<option value="AWD">AWD</option>
							<option value="RWD">RWD</option>
							<option value="FWD">FWD</option>
						</select>
						<select
							className="w-full border p-2 rounded-lg"
							value={formData.engineLayout}
							onChange={(e) =>
								handleInputChange("engineLayout", e.target.value)
							}
						>
							<option value="V">V</option>
							<option value="INLINE">INLINE</option>
							<option value="FLAT">FLAT</option>
							<option value="SINGLE_MOTOR">SINGLE_MOTOR</option>
							<option value="DUAL_MOTOR">DUAL_MOTOR</option>
						</select>
					</div>

					{/* CLASSIFICATION - Added missing fields */}
					<div className="space-y-2">
						<label className="text-xs font-bold uppercase text-slate-500">
							Classification
						</label>
						<select
							className="w-full border p-2 rounded-lg"
							value={formData.bodyType}
							onChange={(e) => handleInputChange("bodyType", e.target.value)}
						>
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
						<select
							className="w-full border p-2 rounded-lg"
							value={formData.roofType}
							onChange={(e) => handleInputChange("roofType", e.target.value)}
						>
							<option value="SOFTTOP">Soft Top</option>
							<option value="HARDTOP">Hard Top</option>
							<option value="TARGA">Targa</option>
							<option value="SLICKTOP">Slicktop</option>
							<option value="PANORAMIC">Panoramic</option>
						</select>
						<select
							className="w-full border p-2 rounded-lg"
							value={formData.vehicleClass}
							onChange={(e) =>
								handleInputChange("vehicleClass", e.target.value)
							}
						>
							<option value="ECONOMY">Economy</option>
							<option value="LUXURY">Luxury</option>
							<option value="PERFORMANCE">Performance</option>
							<option value="OFFROAD">Off Road</option>
							<option value="FULL_SIZE">Full Size</option>
							<option value="ELECTRIC">Electric</option>
						</select>
					</div>

					{/* TEXT AREAS */}
					<div className="md:col-span-1 space-y-2">
						<label className="text-xs font-bold uppercase text-slate-500">
							Description
						</label>
						<textarea
							placeholder="Description"
							className="w-full border p-2 rounded-lg h-28"
							value={formData.description}
							onChange={(e) => handleInputChange("description", e.target.value)}
						/>
					</div>

					<div className="md:col-span-2 space-y-2">
						<label className="text-xs font-bold uppercase text-slate-500">
							Media & Features
						</label>
						<input
							placeholder="Features (comma separated)"
							className="w-full border p-2 rounded-lg"
							value={formData.features}
							onChange={(e) => handleArrayChange("features", e.target.value)}
						/>
						<textarea
							placeholder="Image URLs (comma separated)"
							className="w-full border p-2 rounded-lg h-20"
							value={formData.images}
							onChange={(e) => handleArrayChange("images", e.target.value)}
						/>
					</div>
				</div>

				<button
					type="submit"
					disabled={isLoading}
					className="mt-8 w-full py-4 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all shadow-lg disabled:bg-slate-300"
				>
					{isLoading ? "Adding Vehicle..." : "Add Vehicle to Fleet"}
				</button>
			</form>
		</div>
	);
};

export default EditCarPage;
