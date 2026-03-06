import Image from "next/image";
import bigLogoImage from "../../media/bigLogo.svg";
import HeaderMenuButton from "../buttons/headerMenuButton";
import Link from "next/link";

const LandingHeader = () => {
	return (
		<div className="relative md:py-[20px] px-[10px] md:px-[100px] px-[20px] flex items-center justify-between">
			<Link href={"/"}>
				<Image
					width={200}
					height={400}
					src={bigLogoImage}
					alt={"Header Logo"}
				/>
			</Link>

			<HeaderMenuButton />
		</div>
	);
};

export default LandingHeader;
