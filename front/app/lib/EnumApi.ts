import { CarEnums } from "../types/CarEnums";
import { CarPages } from "../types/CarTypes";

const defaultHeaders = {
	"Content-Type": "application/json",
};

const defaultNext = {
	next: { revalidate: Number(process.env.REVALIDATE_SECONDS) },
};

export const getAllEnums = async (): Promise<CarEnums> => {
	const res = await fetch(
		`${process.env.API_BASE_URL}/enums`,
		{ ...defaultNext, headers: defaultHeaders },
	);
	if (!res.ok) throw new Error(await res.text());
	return res.json();
};
