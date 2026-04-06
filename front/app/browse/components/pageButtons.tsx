"use client";
import { CarPages } from "@/app/types/CarTypes";
import { useState } from "react";
import { useFilterParams } from "./useFilterParams";

const PageButtons = ({ carsPages }: { carsPages: CarPages }) => {
	const { get, set } = useFilterParams();
	const [inputPage, setInputPage] = useState<string>(
		carsPages.currentPage.toString(),
	);

	const setPage = (page: number) => {
		const clamped = Math.max(1, Math.min(page, carsPages.totalPages));
		set({ page: clamped });
		setInputPage(clamped.toString());
	};

	const handleInputBlur = () => {
		const parsed = parseInt(inputPage);
		if (!isNaN(parsed)) setPage(parsed);
		else setInputPage(carsPages.currentPage.toString());
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") handleInputBlur();
	};

	return (
		<div className="flex items-center justify-center gap-[20px] mt-[20px]">
			<button
				className="bg-accent text-primary-dark rounded-full flex justify-center items-center w-[26px] h-[26px] cursor-pointer"
				onClick={() =>
					carsPages.currentPage > 1 && setPage(carsPages.currentPage - 1)
				}
			>
				{"<-"}
			</button>
			<h3 className="text-[11pt] flex items-center gap-[6px]">
				<input
					type="text"
					value={inputPage}
					onChange={(e) => setInputPage(e.target.value)}
					onBlur={handleInputBlur}
					onKeyDown={handleKeyDown}
					className="w-[48px] text-center bg-transparent border border-third rounded-full outline-none text-[11pt]"
				/>
				/ {carsPages.totalPages}
			</h3>
			<button
				className="bg-accent text-primary-dark rounded-full flex justify-center items-center w-[26px] h-[26px] cursor-pointer"
				onClick={() =>
					carsPages.currentPage < carsPages.totalPages &&
					setPage(carsPages.currentPage + 1)
				}
			>
				{"->"}
			</button>
		</div>
	);
};

export default PageButtons;
