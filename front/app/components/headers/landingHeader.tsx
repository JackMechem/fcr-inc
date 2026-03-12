import Image from "next/image";
import bigLogoImageWhite from "../../media/bigLogoWhite.svg";
import bigLogoImageRed from "../../media/bigLogo.svg";
import HeaderMenuButton from "../buttons/headerMenuButton";
import Link from "next/link";
import CartButton from "../buttons/cartButton";

const LandingHeader = ({ white }: { white?: boolean }) => {
	return (
		<div className="relative md:py-[20px] px-[10px] md:px-[100px] px-[20px] flex items-center justify-between">
			<Link href={"/"}>
				{white ? (
					<Image
						width={200}
						height={400}
						src={bigLogoImageWhite}
						alt={"Header Logo"}
					/>
				) : (
					<Image
						width={200}
						height={400}
						src={bigLogoImageRed}
						alt={"Header Logo"}
					/>
				)}
			</Link>
		<div className={`relative ${white ? "text-primary" : "text-accent"} flex gap-[15px] text-[20pt] items-center`}>
            <CartButton />
			<HeaderMenuButton red={!white} />
		</div>
		</div>
	);
};

export default LandingHeader;
