export interface Car {
	vin: string;
	make: string;
	model: string;
	description: string;
	cylinders: number;
	gears: number;
	horsepower: number;
	torque: number;
	seats: number;
	pricePerDay: number;
	mpg: number;
	features: string[];
	images: string[];
	transmission: string;
	drivetrain: string;
	engineLayout: string;
	fuel: string;
	bodyType: string;
	roofType: string;
	vehicleClass: string;
	modelYear: number;
	[key: string]: string | number | string[] | undefined;
}
