import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
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
