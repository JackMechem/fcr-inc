import Link from "next/link";
import { BiSearch } from "react-icons/bi";

const SmallSearchBar = () => {
	return (
		<div className="w-auto flex flex-col flex-shrink px-0 items-center ">
			<div className="md:flex hidden flex-row w-fit gap-[10px] h-auto p-[5px] pl-[20px] bg-primary/80 border border-third rounded-full focus-within:border-accent focus-within:scale-[101%] duration-150">
				<div className="w-[165px]">
					<p className="text-[10pt]">What</p>
					<input
						placeholder="Make, model, or year"
						className="outline-none text-foreground w-full min-w-full"
					/>
				</div>
				<div className="w-[120px]">
					<p className="text-[10pt]">From</p>
					<input placeholder="Add date" className="outline-none text-foreground w-full min-w-full" />
				</div>
				<div className="w-[120px]">
					<p className="text-[10pt]">Until</p>
					<input placeholder="Add date" className="outline-none text-foreground w-full min-w-full" />
				</div>
				<Link href={"/browse"} className="cursor-pointer flex justify-center items-center text-center md:h-fill md:py-0 md:mt-0 mt-[10px] py-[10px] px-[10px] text-[18pt] bg-accent text-primary rounded-full">
					<BiSearch />
				</Link>
			</div>
		</div>
	);
};

export default SmallSearchBar;
