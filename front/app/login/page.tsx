"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import NavHeader from "../components/headers/navHeader";
import Cookies from "js-cookie";
import { validateCredentials } from "../lib/AuthValidation";
import styles from "./login.module.css";

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
		}
	};

	return (
		<div>
			<NavHeader white={false} />
			<div className={styles.pageWrapper}>
				<div className={styles.card}>
					<h1 className={`page-title ${styles.title}`}>Login</h1>
					<p className={`page-subtitle ${styles.subtitle}`}>Enter login credentials</p>

					<div className={styles.fields}>
						<div className={styles.fieldGroup}>
							<label className={styles.label}>Username</label>
							<input
								type="text"
								value={credentials.username}
								onChange={(e) =>
									setCredentials({
										password: credentials.password,
										username: e.target.value,
									})
								}
								className={styles.input}
							/>
						</div>

						<div className={styles.fieldGroup}>
							<label className={styles.label}>Password</label>
							<input
								type="password"
								value={credentials.password}
								onChange={(e) =>
									setCredentials({
										password: e.target.value,
										username: credentials.username,
									})
								}
								className={styles.input}
							/>
						</div>

						<button onClick={handleLogin} className={styles.submitBtn}>
							Sign in
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default LoginPage;
