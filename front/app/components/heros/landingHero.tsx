import Image from "next/image";
import LandingSearchBar from "../searchBars/landingSearchBar";
import CarTransparentBg from "../../media/transparentCar.png";

const LandingHero = () => {
	return (
		<div className="relative w-full flex flex-col gap-[20px] items-center overflow-x-clip md:mb-[330px] mb-[300px]">
			<div
				className="absolute xl:w-[140vw] xl:h-[140vw] lg:w-[170vw] lg:h-[170vw] md:w-[180vw] md:h-[180vw] w-[550vw] h-[550vw] md:bottom-[-150px] bottom-[-100px] left-1/2 -translate-x-1/2 rounded-full overflow-hidden z-[-1]"
				style={{
					background:
						"linear-gradient(180deg, var(--Primary, #FDFDFF) 0%, #C69192 50%, var(--Accent, #993537) 100%)",
				}}
			>
				<div
					className="absolute inset-0 rounded-full opacity-30"
					style={{
						backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.3' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
						backgroundSize: "200px 200px",
						mixBlendMode: "overlay",
					}}
				/>
			</div>
			<h1
				className="font-titillium md:text-[76pt] text-[64pt] text-primary font-bold max-w-[500px] text-center leading-[90%] tracking-[-2%]  w-fit md:mt-0 mt-[20px]"
			>
				Get a Fast Car Fast
			</h1>
			<p className="text-center text-primary font-[500] text-[14pt] mb-[20px]">
				Rent any car, anytime, anywhere
			</p>
			<LandingSearchBar />
			<Image
				src={CarTransparentBg.src}
				alt={"Car transparent background"}
				width={600}
				height={600}
				className="absolute md:bottom-[-270px] bottom-[-210px] md:w-[600px] w-[500px] min-w-[500px] hover:scale-[105%] duration-[100ms]"
			/>
		</div>
	);
};

export default LandingHero;
