import Image from "next/image";
import Link from "next/link";

interface CarBrandCardProps {
	title: string;
	startingPrice: number;
	logoImage: string;
	carImage: string;
    searchURL?: string;
}

const CarBrandCard = ({
	title,
	startingPrice,
	logoImage,
	carImage,
    searchURL = "/browse?make=" + title.toLowerCase()
}: CarBrandCardProps) => {
	return (
		<div className="flex flex-col gap-[40px] md:min-w-[500px] md:w-[500px] min-w-full bg-primary-dark rounded-lg px-[30px] py-[25px] shadow-md">
			<div className="h-[52px] w-full flex p-[5px] items-center justify-between">
				<Image
					src={logoImage}
					alt={title + " logo"}
					width={50}
					height={50}
					className="h-full w-fit"
				/>
				<p className="w-fit text-secondary text-[14pt]">{title}</p>
			</div>
			<Image
				src={carImage}
				alt={title + " car image"}
				width={440}
				height={200}
				className="h-[200px] w-full object-contain"
			/>
			<div className="flex justify-between items-center md:flex-row flex-col md:gap-0 gap-[20px]">
				<div>
					<p className="text-[10pt] text-secondary">Starting at</p>
                    <h3 className="text-accent text-[18pt]">${startingPrice}<span className="text-[12pt] opacity-[0.6]">/day</span></h3>
				</div>
                <Link href={searchURL} className="px-[25px] py-[8px] h-fit text-center rounded-full bg-accent text-primary">Browse {title}</Link>
			</div>
		</div>
	);
};

export default CarBrandCard;
