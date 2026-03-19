import type { Metadata } from "next";
import { Inter, Titillium_Web } from "next/font/google";
import "./globals.css";
import LandingHeader from "./components/headers/landingHeader";
import MainBodyContainer from "./components/containers/mainBodyContainer";

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-inter",
});

const titillium = Titillium_Web({
	weight: ["400", "700", "900"],
	style: ["normal", "italic"],
	subsets: ["latin"],
	variable: "--font-titillium",
});

export const metadata: Metadata = {
	title: "FCR - Fast Car Rentals",
	description: "Not a real car rental website",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={`${inter.variable} ${titillium.variable} antialiased overflow-x-hidden bg-primary h-full`}>
                {children}
			</body>
		</html>
	);
}
