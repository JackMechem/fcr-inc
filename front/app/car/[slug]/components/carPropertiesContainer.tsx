import { ReactNode } from "react";

const CarPropertiesContainer = ({ children }: { children: ReactNode }) => {
	return (
		<div className="flex flex-wrap gap-[10px] mt-[10px] w-fit text-nowrap">
			{children}
		</div>
	);
};

export default CarPropertiesContainer;
