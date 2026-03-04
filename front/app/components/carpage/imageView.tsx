import { Car } from "@/app/types/CarTypes";
import Image from "next/image";

interface ImageViewProps {
	imgUrls: Car["imageUrls"];
}

const ImageView = ({ imgUrls }: ImageViewProps) => {
	return (
		<div className="flex gap-[10px]">
			<Image
				src={imgUrls[0]}
				className="w-1/2 rounded-xl"
				alt="car image"
				height={800}
				width={800}
			/>
			<div className="grid grid-cols-2 w-1/2">
				{imgUrls.map((url: string, index: number) => {
					if (index > 0 && index <= 6) {
						return (
							<Image
								key={url}
								src={url}
								alt="car image"
								height={600}
								width={600}
								className="w-auto h-auto rounded-xl"
							/>
						);
					}
				})}
			</div>
		</div>
	);
};

export default ImageView;
