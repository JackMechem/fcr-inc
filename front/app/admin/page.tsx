"use client";

import { useEffect } from "react";
import MainBodyContainer from "../components/containers/mainBodyContainer";
import NavHeader from "../components/headers/navHeader";
import TitleText from "../components/text/titleText";
import AdminSidebar from "../components/menus/adminSidebar";
import CarFormPanel from "./components/CarFormPanel";
import DashboardPanel from "./components/DashboardPanel";
import InventoryPanel from "./components/InventoryPanel";
import ReservationsPanel from "./components/ReservationsPanel";
import { useAdminSidebarStore } from "@/stores/adminSidebarStore";
import { useWindowSize } from "@/app/hooks/useWindowSize";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { validateCredentials } from "../lib/AuthValidation";

export default function AdminPage() {
	const router = useRouter();
	const { collapsed, activeView } = useAdminSidebarStore();
	const { width } = useWindowSize();
	const isMobile = width !== undefined && width < 768;

	useEffect(() => {
		const raw = Cookies.get("credentials");
		if (!raw) { router.replace("/login"); return; }
		const { username, password } = JSON.parse(raw);
		validateCredentials(username, password).then((status) => {
			if (status !== 200) router.replace("/login");
		});
	}, []);

	const renderContent = () => {
		switch (activeView) {
			case "add-car":
				return (
					<div>
						<TitleText className="mb-[24px]">Add Car</TitleText>
						<CarFormPanel mode="add" />
					</div>
				);
			case "edit-car":
				return (
					<div>
						<TitleText className="mb-[24px]">Edit Car</TitleText>
						<CarFormPanel mode="edit" />
					</div>
				);
			case "view-data":
				return <InventoryPanel />;
			case "view-reservations":
				return <ReservationsPanel />;
			default:
				return <DashboardPanel />;
		}
	};

	return (
		<>
			<NavHeader white={false} />
			<AdminSidebar />
			<div
				className="transition-all duration-300 ease-in-out"
				style={{
					paddingLeft: isMobile ? 0 : collapsed ? 64 : 220,
					paddingBottom: isMobile ? 80 : 0,
				}}
			>
				<MainBodyContainer>
					<div className="py-[40px]">
						{renderContent()}
					</div>
				</MainBodyContainer>
			</div>
		</>
	);
}
