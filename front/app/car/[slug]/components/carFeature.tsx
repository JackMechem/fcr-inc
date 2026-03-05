import { ReactNode } from "react";

const CarFeature = ({ children }: { children: ReactNode }) => {
	return (
		<div className="text-nowrap bg-accent px-[15px] py-[5px] text-primary text-[14px] rounded-full opacity-[0.8] font-[500]">
			{children}
		</div>
	);
};

export default CarFeature;
