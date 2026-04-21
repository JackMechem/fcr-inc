"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { BiCar, BiCheck, BiSearch, BiX, BiChevronLeft, BiChevronRight } from "react-icons/bi";
import { getFilteredCarsAdmin, getCarAdmin } from "@/app/lib/AdminApiCalls";
import styles from "./adminForm.module.css";

export interface CopyOption {
	vin: string;
	make: string;
	model: string;
	modelYear: number;
	images: string[];
	vehicleClass: string;
	pricePerDay: number;
}

interface CopyPickerProps {
	selectedVin: string | null;
	onSelect: (vin: string | null) => void;
	mode: "add" | "edit";
}

const PAGE_SIZE = 10;

const CopyPicker = ({
	selectedVin,
	onSelect,
	mode,
}: CopyPickerProps) => {
	const [query, setQuery] = useState("");
	const [searchMode, setSearchMode] = useState<"search" | "vin">("search");
	const [options, setOptions] = useState<CopyOption[]>([]);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [loading, setLoading] = useState(false);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const fetchIdRef = useRef(0);

	const fetchCars = async (q: string, p: number, m: "search" | "vin") => {
		const id = ++fetchIdRef.current;
		setLoading(true);
		try {
			if (m === "vin" && q.trim()) {
				try {
					const car = await getCarAdmin(q.trim());
					if (id !== fetchIdRef.current) return;
					setOptions([car as CopyOption]);
					setTotalPages(1);
				} catch {
					if (id !== fetchIdRef.current) return;
					setOptions([]);
					setTotalPages(1);
				}
			} else {
				const params: Record<string, string | number | undefined> = {
					select: "vin,make,model,modelYear,images,vehicleClass,pricePerDay",
					pageSize: PAGE_SIZE,
					page: p,
				};
				if (q.trim()) params.search = q.trim();
				const res = await getFilteredCarsAdmin(params);
				if (id !== fetchIdRef.current) return;
				setOptions(res.data as CopyOption[]);
				setTotalPages(res.totalPages);
				setPage(res.currentPage);
			}
		} catch {
			if (id !== fetchIdRef.current) return;
			setOptions([]);
		} finally {
			if (id === fetchIdRef.current) setLoading(false);
		}
	};

	// Fetch on mount and when page changes (page is changed by user clicks only)
	useEffect(() => {
		fetchCars(query, page, searchMode);
	}, [page]);

	// Debounced fetch when query or searchMode changes — resets to page 1
	useEffect(() => {
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			if (page === 1) {
				fetchCars(query, 1, searchMode);
			} else {
				setPage(1); // triggers the page useEffect
			}
		}, 300);
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [query, searchMode]);

	return (
		<div className={styles.copyPickerCard}>
			<div className={styles.copyPickerHeader}>
				<p className={styles.copyPickerTitle}>
					{mode === "edit"
						? "Select a vehicle to edit"
						: "Copy from existing vehicle"}
				</p>
				{selectedVin && (
					<button
						type="button"
						onClick={() => onSelect(null)}
						className={styles.copyPickerClearBtn}
					>
						<BiX /> Clear
					</button>
				)}
			</div>

			<div className={styles.copyPickerSearchRow}>
				<button
					type="button"
					className={`${styles.copyPickerModeBtn} ${searchMode === "search" ? styles.copyPickerModeBtnActive : ""}`}
					onClick={() => setSearchMode("search")}
				>
					Search
				</button>
				<button
					type="button"
					className={`${styles.copyPickerModeBtn} ${searchMode === "vin" ? styles.copyPickerModeBtnActive : ""}`}
					onClick={() => setSearchMode("vin")}
				>
					VIN
				</button>
				<div className={styles.copyPickerSearch}>
					<BiSearch className={styles.copyPickerSearchIcon} />
					<input
						className={`${styles.input} ${styles.copyPickerSearch}`}
						style={{ paddingLeft: "36px" }}
						placeholder={
							searchMode === "vin"
								? "Enter exact VIN…"
								: mode === "edit"
									? "Search for a vehicle to edit…"
									: "Search by make, model or VIN…"
						}
						value={query}
						onChange={(e) => setQuery(e.target.value)}
					/>
				</div>
			</div>

			<div className={`${styles.copyPickerStripWrapper}`}>
				{loading && <div className={styles.copyPickerLoadingOverlay}>Loading…</div>}
			<div className={`${styles.copyPickerStrip} scrollbar-hide`} style={loading ? { opacity: 0.4, pointerEvents: "none" } : undefined}>
				{options.length === 0 && !loading && (
					<p className={styles.copyPickerEmpty}>No vehicles found.</p>
				)}
				{options.map((car) => {
					const isSelected = selectedVin === car.vin;
					return (
						<button
							key={car.vin}
							type="button"
							onClick={() => onSelect(isSelected ? null : car.vin)}
							className={`${styles.copyPickerCarBtn} ${isSelected ? styles.copyPickerCarBtnSelected : ""}`}
						>
							<div className={styles.copyPickerThumb}>
								{car.images?.[0] ? (
									<Image
										src={car.images[0]}
										alt={`${car.make} ${car.model}`}
										fill
										className={styles.copyPickerCarImage}
										sizes="160px"
									/>
								) : (
									<div className={styles.copyPickerNoImage}>
										<BiCar />
									</div>
								)}
								{isSelected && (
									<div className={styles.copyPickerCheckBadge}>
										<BiCheck className={styles.copyPickerCheckIcon} />
									</div>
								)}
							</div>
							<div className={styles.copyPickerInfo}>
								<p className={styles.copyPickerCarName}>
									{car.make} {car.model}
								</p>
								<p className={styles.copyPickerCarYear}>{car.modelYear}</p>
								<p className={styles.copyPickerCarPrice}>
									${car.pricePerDay}/day
								</p>
							</div>
						</button>
					);
				})}
			</div>
			</div>

			{searchMode === "search" && totalPages > 1 && (
				<div className={styles.copyPickerPagination}>
					<button
						type="button"
						disabled={page <= 1}
						onClick={() => setPage((p) => p - 1)}
						className={styles.copyPickerPageBtn}
					>
						<BiChevronLeft />
					</button>
					<span className={styles.copyPickerPageInfo}>
						{page} / {totalPages}
					</span>
					<button
						type="button"
						disabled={page >= totalPages}
						onClick={() => setPage((p) => p + 1)}
						className={styles.copyPickerPageBtn}
					>
						<BiChevronRight />
					</button>
				</div>
			)}
		</div>
	);
};

export default CopyPicker;
