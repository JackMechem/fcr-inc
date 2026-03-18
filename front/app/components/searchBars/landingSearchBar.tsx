import Link from "next/link";
import { BiSearch } from "react-icons/bi";

const LandingSearchBar = () => {
	return (
		<div className="w-full flex flex-col md:px-0 px-[20px] items-center">
			<div className="flex md:flex-row md:w-auto w-full flex-col gap-[10px] h-auto md:p-[10px] p-[15px] md:pl-[25px] bg-primary md:rounded-full rounded-3xl shadow focus-within:border-accent focus-within:scale-[101%] duration-150">
				<div>
					<p className="text-[10pt]">What</p>
					<input
						placeholder="Make, model, or year"
						className="outline-none text-foreground"
					/>
				</div>
				<div>
					<p className="text-[10pt]">From</p>
					<input placeholder="Add date" className="outline-none" />
				</div>
				<div>
					<p className="text-[10pt]">Until</p>
					<input placeholder="Add date" className="outline-none" />
				</div>
				<Link href={"/browse"} className="cursor-pointer flex justify-center items-center text-center md:h-fill md:py-0 md:mt-0 mt-[10px] py-[10px] px-[10px] text-[18pt] bg-accent text-primary rounded-full">
					<BiSearch />
				</Link>
			</div>
		</div>
	);
};

export default LandingSearchBar;
