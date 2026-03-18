"use client";

import { CarPages } from "@/app/types/CarTypes";
import { usePathname, useSearchParams, useRouter } from "next/navigation";

const PageButtons = ({ carsPages }: { carsPages: CarPages }) => {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const setPage = (page: number) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set("page", String(page));
		router.push(`${pathname}?${params.toString()}`);
	};

    console.log(carsPages.currentPage);
	return (
		<div>
            <button onClick={carsPages.totalPages > carsPages.currentPage ? () => setPage(carsPages.currentPage + 1) : () => {}}>{"->"}</button>
			<h3>
				Page {carsPages.currentPage} / {carsPages.totalPages}
			</h3>
            <button onClick={carsPages.currentPage != 1 ? () => setPage(carsPages.currentPage - 1) : () => {}}>{"<-"}</button>
		</div>
	);
};

export default PageButtons;
