"use client";

import { Car } from "@/app/types/CarTypes";
import Image from "next/image";
import { useState } from "react";
import { BiImage } from "react-icons/bi";
import { GrClose } from "react-icons/gr";

interface ShowAllImagesButtonProps {
	imgUrls: Car["imageUrls"];
}

const ShowAllImagesButton = ({ imgUrls }: ShowAllImagesButtonProps) => {
	const [imageViewShown, setImageViewShown] = useState<boolean>(false);
	return (
		<>
			{imageViewShown && (
				<div className="fixed w-full h-full top-0 left-0 right-0 bottom-0 bg-primary grid md:grid-cols-2 grid-cols-1 p-[20px] gap-[20px] overflow-y-scroll z-10 pt-[120px]">
					<button
						onClick={() => setImageViewShown(false)}
						className="fixed top-[40px] left-[40px] bg-primary rounded-full p-[10px] cursor-pointer"
					>
						<GrClose />
					</button>
					{imgUrls.map((url: string, index: number) => (
						<Image
							key={url + index}
							src={url}
							alt="car image"
							width={400}
							height={400}
							className="w-full h-full rounded-lg object-cover"
						/>
					))}
				</div>
			)}
			<div
				onClick={() => setImageViewShown(true)}
				className="absolute flex gap-[6px] items-center bottom-[10px] right-[10px] bg-primary rounded-lg border-[2px] text-foreground text-[14px] border-third shadow-lg px-[15px] py-[5px] cursor-pointer"
			>
				<BiImage /> View all images
			</div>
		</>
	);
};

export default ShowAllImagesButton;
