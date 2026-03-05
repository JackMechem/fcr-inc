import { PropsWithChildren } from "react";
import FastLines from "../../media/fastLines.svg";
import Image from "next/image";

interface TitleTextProps extends PropsWithChildren {
	className?: string;
}

const TitleText = ({ children, className }: TitleTextProps) => {
	return (
		<div
			className={
				className +
				" flex items-center font-titillium text-[24pt] font-bold text-accent italic"
			}
		>
			<Image src={FastLines.src} alt="text decoration" width={40} height={40} />
			<h2 className={""}>{children}</h2>
		</div>
	);
};

export default TitleText;
