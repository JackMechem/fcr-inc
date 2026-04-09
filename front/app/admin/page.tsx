"use client";

import React, { useState } from "react";
import DynamicTable from "./DynamicTable";
import { addCar, getAllCars, deleteCar } from "../lib/AdminApiCalls";
import { Car } from "../types/CarTypes";
import MainBodyContainer from "../components/containers/mainBodyContainer";
import LandingHeader from "../components/headers/landingHeader";
import TitleText from "../components/text/titleText";
import Link from "next/link";
import BrowseHeader from "../components/headers/browseHeader";

export default function AdminPage() {
	const [cars, setCars] = useState<Car[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [hasFetched, setHasFetched] = useState(false);

	// 1. Admin Credentials State
	const [credentials, setCredentials] = useState({
		username: "",
		password: "",
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

	return (
		<>
			<BrowseHeader white={false} />
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

						<TitleText className="mt-[50px] text-[32pt]">Cars</TitleText>
						<Link href={"/admin/editcar"} className="bg-accent text-primary px-[30px] py-[8px] text-[12pt] rounded-xl shadow">
							Add Car
						</Link>

						{/* VEHICLE ENTRY FORM */}
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
						{hasFetched ? (
							<DynamicTable
								data={cars}
								title="Inventory List"
								onDelete={handleDelete}
							/>
						) : (
							<p>loading...</p>
						)}
					</section>
				</div>
			</MainBodyContainer>
		</>
	);
}
