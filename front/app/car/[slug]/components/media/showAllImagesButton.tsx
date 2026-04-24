"use client";

import { Car } from "@/app/types/CarTypes";
import Image from "next/image";
import { useState } from "react";
import { BiImage } from "react-icons/bi";
import { GrClose } from "react-icons/gr";
import styles from "../carDetail.module.css";

interface ShowAllImagesButtonProps {
	images: Car["images"];
}

const ShowAllImagesButton = ({ images }: ShowAllImagesButtonProps) => {
	const [imageViewShown, setImageViewShown] = useState<boolean>(false);
	return (
		<>
			{imageViewShown && (
				<div className={styles.imageOverlay}>
					<button
						onClick={() => setImageViewShown(false)}
						className={styles.overlayCloseBtn}
					>
						<GrClose />
					</button>
					{images.map((url: string, index: number) => (
						<Image
							key={url + index}
							src={url}
							alt="car image"
							width={400}
							height={400}
							className={styles.overlayImage}
							loading="lazy"
						/>
					))}
				</div>
			)}
			<div
				onClick={() => setImageViewShown(true)}
				className={styles.viewAllBtn}
			>
				<BiImage /> View all images
			</div>
		</>
	);
};

export default ShowAllImagesButton;
