import { useState, useEffect } from "react";

export const useHydrated = () => {
	const [hydrated, setHydrated] = useState(false);
	useEffect(() => {
		setHydrated(true); // eslint-disable-line react-hooks/set-state-in-effect
	}, []);
	return hydrated;
};
