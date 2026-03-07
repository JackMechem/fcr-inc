import Link from "next/link";

const HeaderMenu = () => {
	return (
		<div className="absolute z-100 md:right-[50px] right-[10px] top-[70%] bg-primary py-[20px] px-[20px] border border-third shadow-md rounded-lg text-foreground min-w-[300px]">
			<Link
				href={"/login"}
				className="font-titillium font-bold text-[18pt] text-accent"
			>
				Login/Signup
			</Link>
			<h3 className="font-titillium font-bold text-[16pt] text-accent mt-[20px]">
				Cart
			</h3>
			<p>No cars in cart!</p>
		</div>
	);
};

export default HeaderMenu;
