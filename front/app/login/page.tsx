"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import NavHeader from "../components/headers/navHeader";
import Cookies from "js-cookie";
import { validateCredentials } from "../lib/AuthValidation";

interface ICredentials {
	username: string;
	password: string;
}

const LoginPage = () => {
	const router = useRouter();
	const [credentials, setCredentials] = useState<ICredentials>({
		username: "",
		password: "",
	});

	const handleLogin = async () => {
		const validated = await validateCredentials(
			credentials.username,
			credentials.password,
		);
		if (validated === 200) {
			Cookies.set("credentials", JSON.stringify(credentials), { path: "/" });
			router.back();
		} else {
		}
	};

	return (
		<div>
			<NavHeader white={false} />
			<div className="min-h-screen flex items-center justify-center bg-white">
				<div className="w-full max-w-sm border border-accent/30 rounded-2xl p-8 shadow-md bg-white">
					<h1 className="text-3xl text-accent mb-3">Login</h1>
					<p className="text-sm text-accent/60 mb-6">Enter login credentials</p>

					<div className="space-y-4">
						<div className="space-y-1">
							<label className="text-xs uppercase tracking-wide text-accent/60">
								Username
							</label>
							<input
								type="text"
								value={credentials.username}
								onChange={(e) =>
									setCredentials({
										password: credentials.password,
										username: e.target.value,
									})
								}
								className="w-full bg-accent/5 border border-accent/10 rounded-xl px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-transparent transition"
							/>
						</div>

						<div className="space-y-1">
							<label className="text-xs uppercase tracking-wide text-accent/60">
								Password
							</label>
							<input
								type="password"
								value={credentials.password}
								onChange={(e) =>
									setCredentials({
										password: e.target.value,
										username: credentials.username,
									})
								}
								className="w-full bg-accent/5 border border-accent/10 rounded-xl px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-transparent transition"
							/>
						</div>

						<button
							onClick={handleLogin}
							className="w-full mt-2 py-2.5 bg-accent hover:bg-accent/90 text-white font-medium rounded-xl transition-colors"
						>
							Sign in
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default LoginPage;
