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
		<div className="flex items-center justify-center gap-[20px] mt-[20px]">
			<button
				className="bg-accent text-primary-dark rounded-full flex justify-center items-center w-[26px] h-[26px] cursor-pointer"
				onClick={
					carsPages.currentPage != 1
						? () => setPage(carsPages.currentPage - 1)
						: () => {}
				}
			>
				{"<-"}
			</button>
			<h3 className="text-[11pt]">
				{carsPages.currentPage} / {carsPages.totalPages}
			</h3>

			<button
				className="bg-accent text-primary-dark rounded-full flex justify-center items-center w-[26px] h-[26px] cursor-pointer"
				onClick={
					carsPages.totalPages > carsPages.currentPage
						? () => setPage(carsPages.currentPage + 1)
						: () => {}
				}
			>
				{"->"}
			</button>
		</div>
	);
};

export default PageButtons;
