"use client";

import React, { useState } from "react";
import DynamicTable from "./DynamicTable";
import { addCar, getAllCars, deleteCar } from "../lib/AdminApiCalls";
import { Car } from "../types/CarTypes";
import MainBodyContainer from "../components/containers/mainBodyContainer";
import LandingHeader from "../components/headers/landingHeader";
import TitleText from "../components/text/titleText";

export default function AdminPage() {
	const [cars, setCars] = useState<Car[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [hasFetched, setHasFetched] = useState(false);

	// 1. Admin Credentials State
	const [credentials, setCredentials] = useState({
		username: "",
		password: "",
	});

	// 2. Initial State covering every parameter from the Car interface
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

	const handleDelete = async (vin: string) => {
		if (!credentials.username || !credentials.password) {
			alert("Please enter Admin Credentials first.");
			return;
		}

		const confirmDelete = window.confirm(
			`Are you sure you want to delete vehicle ${vin}? This action cannot be undone.`,
		);

		if (confirmDelete) {
			setIsLoading(true);
			try {
				await deleteCar(vin, credentials.username, credentials.password);
				setCars((prev) => prev.filter((car) => car.vin !== vin));
				alert("Car deleted successfully.");
			} catch (error) {
				alert("Error deleting car: " + error);
			} finally {
				setIsLoading(false);
			}
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!credentials.username || !credentials.password) {
			alert("Please enter Admin Credentials above.");
			return;
		}

		setIsLoading(true);
		try {
			// Casting to Car ensures all required fields from the interface are present
			await addCar(formData as Car, credentials.username, credentials.password);
			alert("Car added successfully!");
			handleFetchData(); // Refresh list after adding
		} catch (error) {
			alert("Error: " + error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			<LandingHeader />
			<MainBodyContainer>
				<div className="space-y-10 pb-20">
					<section>
						<TitleText className="text-[42pt]">Admin Dashboard</TitleText>

						{/* ADMIN AUTH SECTION */}
						<div className="mt-6 flex flex-col md:flex-row gap-4 p-6 bg-slate-100 rounded-2xl border border-slate-200">
							<div className="flex-1">
								<label className="block text-xs font-bold text-slate-500 uppercase mb-1">
									Admin Username
								</label>
								<input
									type="text"
									placeholder="Username"
									className="w-full border p-2 rounded-lg"
									onChange={(e) =>
										setCredentials((p) => ({ ...p, username: e.target.value }))
									}
								/>
							</div>
							<div className="flex-1">
								<label className="block text-xs font-bold text-slate-500 uppercase mb-1">
									Admin Password
								</label>
								<input
									type="password"
									placeholder="Password"
									className="w-full border p-2 rounded-lg"
									onChange={(e) =>
										setCredentials((p) => ({ ...p, password: e.target.value }))
									}
								/>
							</div>
						</div>

						{/* VEHICLE ENTRY FORM */}
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
										onChange={(e) => handleInputChange("vin", e.target.value)}
										required
									/>
									<input
										placeholder="Make"
										className="w-full border p-2 rounded-lg"
										onChange={(e) => handleInputChange("make", e.target.value)}
										required
									/>
									<input
										placeholder="Model"
										className="w-full border p-2 rounded-lg"
										onChange={(e) => handleInputChange("model", e.target.value)}
										required
									/>
									<input
										type="number"
										placeholder="Year"
										className="w-full border p-2 rounded-lg"
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
										onChange={(e) =>
											handleInputChange("horsepower", Number(e.target.value))
										}
									/>
									<input
										type="number"
										placeholder="Torque"
										className="w-full border p-2 rounded-lg"
										onChange={(e) =>
											handleInputChange("torque", Number(e.target.value))
										}
									/>
									<input
										type="number"
										placeholder="Cylinders"
										className="w-full border p-2 rounded-lg"
										onChange={(e) =>
											handleInputChange("cylinders", Number(e.target.value))
										}
									/>
									<input
										type="number"
										placeholder="Gears"
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
										onChange={(e) =>
											handleInputChange("pricePerDay", Number(e.target.value))
										}
									/>
									<input
										type="number"
										placeholder="MPG"
										className="w-full border p-2 rounded-lg"
										onChange={(e) =>
											handleInputChange("mpg", Number(e.target.value))
										}
									/>
									<input
										type="number"
										placeholder="Seats"
										className="w-full border p-2 rounded-lg"
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
										onChange={(e) =>
											handleInputChange("drivetrain", e.target.value)
										}
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
										onChange={(e) =>
											handleInputChange("bodyType", e.target.value)
										}
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
										onChange={(e) =>
											handleInputChange("roofType", e.target.value)
										}
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
										onChange={(e) =>
											handleInputChange("description", e.target.value)
										}
									/>
								</div>

								<div className="md:col-span-2 space-y-2">
									<label className="text-xs font-bold uppercase text-slate-500">
										Media & Features
									</label>
									<input
										placeholder="Features (comma separated)"
										className="w-full border p-2 rounded-lg"
										onChange={(e) =>
											handleArrayChange("features", e.target.value)
										}
									/>
									<textarea
										placeholder="Image URLs (comma separated)"
										className="w-full border p-2 rounded-lg h-20"
										onChange={(e) =>
											handleArrayChange("images", e.target.value)
										}
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
					</section>

					{/* TABLE SECTION */}
					<section className="space-y-4">
						<div className="flex justify-between items-end">
							<TitleText>Live Inventory</TitleText>
							<button
								onClick={handleFetchData}
								className="text-sm text-blue-600 underline"
							>
								Refresh List
							</button>
						</div>
						{hasFetched && (
							<DynamicTable
								data={cars}
								title="Inventory List"
								onDelete={handleDelete}
							/>
						)}
					</section>
				</div>
			</MainBodyContainer>
		</>
	);
}
