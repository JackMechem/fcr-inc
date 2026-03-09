import { Car } from "@/app/types/CarTypes";
import Image from "next/image";
import ShowAllImagesButton from "./showAllImagesButton";

interface ImageViewProps {
	images: Car["images"];
}

const ImageView = ({ images: images }: ImageViewProps) => {
	return (
		<div className="relative flex gap-[2px] lg:h-[600px] md:h-[500px] h-[300px] rounded-xl shadow-sm overflow-hidden">
			{images.length > 1 && <ShowAllImagesButton images={images} />}
			<Image
				src={images[0]}
				className={`${images.length > 4 && "lg:w-[60%]"} w-full h-full object-cover`}
				alt="car image"
				height={800}
				width={800}
				priority
				loading="eager"
			/>
			{images.length > 5 && (
				<div className="lg:grid hidden grid-cols-2 w-[40%] gap-[2px]">
					{images.map((url: string, index: number) => {
						if (index > 0 && index <= 4 && images.length > 4) {
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
