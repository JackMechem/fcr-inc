import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
	turbopack: {
		root: path.resolve(__dirname),
	},
	images: {
		qualities: [75, 90, 100],
		deviceSizes: [640, 828, 1080, 1200, 1920, 2560, 3840],
		remotePatterns: [
			{
				protocol: "https",
				hostname: "media.carsandbids.com",
				port: "",
				pathname: "/cdn-cgi/image/**",
			},
			{
				protocol: "https",
				hostname: "images.turo.com",
				port: "",
				pathname: "/media/vehicle/images/**",
			},
			{
				protocol: "https",
				hostname: "api.auto.dev",
				port: "",
				pathname: "/photos/**",
			},
			{
				protocol: "https",
				hostname: "www.caranddriver.com",
				port: "",
				pathname: "/photos/**",
			},
			{
				protocol: "https",
				hostname: "**",
			},
		],
	},
};

export default nextConfig;
