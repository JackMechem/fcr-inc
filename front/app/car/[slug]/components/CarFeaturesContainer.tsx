import { ReactNode } from "react";

const CarFeaturesContainer = ({ children }: { children: ReactNode }) => {
	return <div className="flex flex-wrap gap-[10px] mt-[20px]">{children}</div>;
};

export default CarFeaturesContainer;
