import { ReactNode } from "react";

const MainBodyContainer = ({ children }: { children: ReactNode }) => {
	return (
		<div className="xl:mx-[100px] lg:mx-[50px] mx-[10px] pb-[100px]">
			{children}
		</div>
	);
};

export default MainBodyContainer;
