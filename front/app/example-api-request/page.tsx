import NavHeader from "../components/headers/navHeader";


interface LosAngelesWeatherData {
	icaoId: string;
	receiptTime: string;
	obsTime: number;
	reportTime: string;
	temp: number;
	dewp: number;
	wdik: number;
	wspd: number;
	visib: string;
	altim: number;
	slp: number;
	qcField: number;
	maxT24: number;
	minT24: number;
	metarType: string;
	rawOb: string;
	lat: number;
	lon: number;
	elev: number;
	name: string;
	cover: string;
	fltCat: string;
}

const getData = async () => {
	const res = await fetch(
		"https://aviationweather.gov/api/data/metar?ids=KLAX&format=json",
		{
			next: { revalidate: 3600 },
		},
	);

	if (!res.ok) {
		throw new Error("Failed to fetch data");
	}

	return res.json();
};

const ExampleAPIRequest = async () => {
	const data: LosAngelesWeatherData[] = await getData();
	return (
		<div>
			<NavHeader />
			<div className="w-full px-[100px]">
				<h1 className="text-center text-accent font-titillium font-bold text-[20pt] italic">
					It is {data[0].temp} degrees in {data[0].name}
				</h1>
				<p></p>
			</div>
		</div>
	);
};

export default ExampleAPIRequest;
