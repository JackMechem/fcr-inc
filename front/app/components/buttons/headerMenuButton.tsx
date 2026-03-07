"use client";

import { useState } from "react";
import HeaderMenu from "../menus/headerMenu";

const HeaderMenuButton = () => {
	const [menuShown, setMenuShown] = useState<boolean>(false);

	return (
		<>
			{menuShown && <HeaderMenu />}
			<div
				onClick={() => setMenuShown(!menuShown)}
				className="border-y-[2px] border-accent w-[20px] py-[6px] cursor-pointer"
			>
				<div className="w-full border-t-[2px] border-accent" />
			</div>
		</>
	);
};

export default HeaderMenuButton;
