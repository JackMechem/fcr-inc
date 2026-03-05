import { ReactNode } from "react";

const CarProperty = ({ children }: { children: ReactNode }) => {
	return (
		<div className="bg-third px-[10px] py-[5px] rounded-md w-fit text-foreground">
			{children}
		</div>
	);
};

export default CarProperty;
