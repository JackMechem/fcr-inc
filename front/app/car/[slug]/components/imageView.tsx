import { Car } from "@/app/types/CarTypes";
import Image from "next/image";
import ShowAllImagesButton from "./showAllImagesButton";

interface ImageViewProps {
	imgUrls: Car["imageUrls"];
}

const ImageView = ({ imgUrls }: ImageViewProps) => {
	return (
		<div className="relative flex gap-[2px] lg:h-[600px] md:h-[500px] h-[300px] rounded-xl shadow-sm overflow-hidden">
			{imgUrls.length > 1 && <ShowAllImagesButton imgUrls={imgUrls} />}
			<Image
				src={imgUrls[0]}
				className={`${imgUrls.length > 4 && "lg:w-[60%]"} w-full h-full object-cover`}
				alt="car image"
				height={800}
				width={800}
				priority
				loading="eager"
			/>
			{imgUrls.length > 5 && (
				<div className="lg:grid hidden grid-cols-2 w-[40%] gap-[2px]">
					{imgUrls.map((url: string, index: number) => {
						if (index > 0 && index <= 4 && imgUrls.length > 4) {
							return (
								<Image
									key={url + index}
									src={url}
									alt="car image"
									height={600}
									width={600}
									className="w-auto h-full object-cover"
									loading="lazy"
								/>
							);
						}
					})}
				</div>
			)}
		</div>
	);
};

export default ImageView;
