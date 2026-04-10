"use client";

import React, { useState, useEffect } from "react";
import DynamicTable from "./DynamicTable";
import { addCar, getAllCars, deleteCar } from "../lib/AdminApiCalls";
import { Car } from "../types/CarTypes";
import MainBodyContainer from "../components/containers/mainBodyContainer";
import NavHeader from "../components/headers/navHeader";
import TitleText from "../components/text/titleText";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { validateCredentials } from "../lib/AuthValidation";

export default function AdminPage() {
	const router = useRouter();

	useEffect(() => {
		const raw = Cookies.get("credentials");
		if (!raw) {
			router.replace("/login");
			return;
		}
		const { username, password } = JSON.parse(raw);
		validateCredentials(username, password).then((status) => {
			if (status !== 200) router.replace("/login");
		});
	}, []);

	const [cars, setCars] = useState<Car[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [hasFetched, setHasFetched] = useState(false);

	const [credentials] = useState(() => {
		const raw = Cookies.get("credentials");
		return raw ? JSON.parse(raw) : { username: "", password: "" };
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
			<NavHeader white={false} />
			<MainBodyContainer>
				<div className="space-y-10 pb-20">
					<section>
						<TitleText className="text-[42pt]">Admin Dashboard</TitleText>

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
