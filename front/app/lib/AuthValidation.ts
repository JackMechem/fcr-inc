export const validateCredentials = async (
	username: string,
	password: string,
) => {
	const token = btoa(`${username}:${password}`);

	const res: Response = await fetch("/api/auth/validate", {
		headers: {
			Authorization: `Basic ${token}`,
		},
	});

	return res.status;
};
