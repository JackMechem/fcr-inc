import { Car } from "@/app/types/CarTypes";
import Image from "next/image";
import ShowAllImagesButton from "./showAllImagesButton";
import styles from "../carDetail.module.css";

interface ImageViewProps {
	images: Car["images"];
}

const ImageView = ({ images }: ImageViewProps) => {
	return (
		<div className={styles.imageViewWrapper}>
			{images.length > 1 && <ShowAllImagesButton images={images} />}
			<Image
				src={images[0]}
				className={images.length > 4 ? styles.mainImageNarrow : styles.mainImage}
				alt="car image"
				height={800}
				width={800}
				priority
				loading="eager"
			/>
			{images.length > 5 && (
				<div className={styles.thumbnailGrid}>
					{images.map((url: string, index: number) => {
						if (index > 0 && index <= 4 && images.length > 4) {
							return (
								<Image
									key={url + index}
									src={url}
									alt="car image"
									height={600}
									width={600}
									className={styles.thumbnailImage}
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
