import Link from "next/link";

import redLogo from "../../media/bigLogo.svg";
import Image from "next/image";

const HeaderMenu = () => {
	return (
		<div className="absolute z-100 right-[0px] top-[100%] bg-primary py-[10px] px-[15px] shadow-md text-foreground min-w-[300px] rounded-md">
			<div className="flex w-full flex-col justify-center items-center">
				<div className="flex flex-col gap-[0px] items-center justify-center pl-[5px] pr-[5px] py-[5px] mt-[20px]">
					<div className="h-[60px] relative overflow-hidden aspect-square bg-third rounded-full mb-[10px]">
						<div className="absolute rounded-full w-full h-full top-[65%] bg-secondary" />
						<div className="w-[18px] aspect-square bg-secondary absolute left-[50%] top-[40%] rounded-full -translate-x-[50%] -translate-y-[50%]" />
					</div>
					<Link href={"/signup"} className="font-[500] text-[14pt] w-fit text-center text-accent">
						Signup
					</Link>
					<Link href={"/login"} className="font-[500] text-[14pt] w-fit text-center text-accent">
						Login
					</Link>
				</div>
			</div>

					<Link href={"/admin"} className="font-[500] text-[10pt] w-fit mt-[20px] text-center text-accent">
						Admin Dashboard
					</Link>
		</div>
	);
};

export default HeaderMenu;
