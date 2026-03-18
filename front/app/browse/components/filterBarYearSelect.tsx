"use client";
import { useState, useRef, useEffect } from "react";

interface FilterBarYearRangeProps {
	defaultMin?: string;
	defaultMax?: string;
	onApply: (min: string, max: string) => void;
}

const MIN_YEAR = 1900;

const FilterBarYearRange = ({
	defaultMin,
	defaultMax,
	onApply,
}: FilterBarYearRangeProps) => {
	const currentYear = new Date().getFullYear();
	const [min, setMin] = useState<number>(
		defaultMin ? parseInt(defaultMin) : MIN_YEAR,
	);
	const [max, setMax] = useState<number>(
		defaultMax ? parseInt(defaultMax) : currentYear,
	);
	const [minInput, setMinInput] = useState<string>(
		defaultMin ?? MIN_YEAR.toString(),
	);
	const [maxInput, setMaxInput] = useState<string>(
		defaultMax ?? currentYear.toString(),
	);
	const [open, setOpen] = useState(false);
	const [dragging, setDragging] = useState<"min" | "max" | null>(null);
	const trackRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const minRef = useRef(min);
	const maxRef = useRef(max);

	useEffect(() => {
		minRef.current = min;
	}, [min]);
	useEffect(() => {
		maxRef.current = max;
	}, [max]);

	const clamp = (val: number) => Math.max(MIN_YEAR, Math.min(currentYear, val));
	const range = currentYear - MIN_YEAR;
	const leftPct = ((clamp(min) - MIN_YEAR) / range) * 100;
	const rightPct = ((currentYear - clamp(max)) / range) * 100;

	const getYearFromEvent = (e: MouseEvent | React.MouseEvent) => {
		if (!trackRef.current) return null;
		const rect = trackRef.current.getBoundingClientRect();
		const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
		return Math.round(MIN_YEAR + pct * range);
	};

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(e.target as Node)
			) {
				if (open) {
					onApply(minRef.current.toString(), maxRef.current.toString());
					setOpen(false);
				}
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [open]);

	useEffect(() => {
		if (!dragging) return;
		const handleMouseMove = (e: MouseEvent) => {
			const year = getYearFromEvent(e);
			if (year === null) return;
			if (dragging === "min") {
				const val = Math.min(year, maxRef.current - 1);
				setMin(val);
				setMinInput(val.toString());
			} else {
				const val = Math.max(year, minRef.current + 1);
				setMax(val);
				setMaxInput(val.toString());
			}
		};
		const handleMouseUp = () => setDragging(null);
		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);
		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, [dragging]);

	const handleTrackMouseDown = (e: React.MouseEvent) => {
		const year = getYearFromEvent(e);
		if (year === null) return;
		const distToMin = Math.abs(year - min);
		const distToMax = Math.abs(year - max);
		setDragging(distToMin <= distToMax ? "min" : "max");
	};

	const handleApply = () => {
		setOpen(false);
		onApply(min.toString(), max.toString());
	};

	const handleMinInput = (e: React.ChangeEvent<HTMLInputElement>) => {
		setMinInput(e.target.value);
		const val = parseInt(e.target.value);
		if (isNaN(val)) return;
		setMin(val);
		if (val > max) {
			setMax(val);
			setMaxInput(val.toString());
		}
	};

	const handleMaxInput = (e: React.ChangeEvent<HTMLInputElement>) => {
		setMaxInput(e.target.value);
		const val = parseInt(e.target.value);
		if (isNaN(val)) return;
		setMax(val);
		if (val < min && val >= MIN_YEAR) {
			setMin(val);
			setMinInput(val.toString());
		}
	};

	const handleMinBlur = () => {
		const clamped = Math.max(MIN_YEAR, Math.min(min, max - 1));
		setMin(clamped);
		setMinInput(clamped.toString());
	};

	const handleMaxBlur = () => {
		const clamped = Math.min(currentYear, Math.max(max, min + 1));
		setMax(clamped);
		setMaxInput(clamped.toString());
	};

	return (
		<div className="flex flex-col" ref={containerRef}>
			<label className="text-[8pt] font-[500] ml-[2px] text-foreground-light leading-[100%]">
				Model Year
			</label>
			<div className="relative h-full">
				<button
					onClick={() => setOpen((prev) => !prev)}
					className="bg-primary border border-third rounded-lg px-[10px] py-[5px] w-[140px] text-[11pt] flex items-center gap-[10px] text-nowrap cursor-pointer h-full"
				>
					{`${min} — ${max}`}
					<span className="text-foreground-light text-[8pt] ml-auto">▾</span>
				</button>
				{open && (
					<div className="absolute top-full mt-[4px] left-full -translate-x-1/2 bg-primary border border-third rounded-xl p-[20px] pt-[12px] flex flex-col gap-[12px] z-10 md:w-[400px] w-full">
                        <h1 className="ml-[0px] text-foreground-light text-[14pt] font-[400]">Model Years</h1>
						<div
							ref={trackRef}
							className="relative h-[20px] flex items-center mt-[16px] cursor-pointer mx-[20px]"
							onMouseDown={handleTrackMouseDown}
						>
							<div className="absolute w-full h-[4px] bg-third rounded-full" />
							<div
								className="absolute h-[4px] bg-accent rounded-full"
								style={{ left: `${leftPct}%`, right: `${rightPct}%` }}
							/>
							<div
								className="absolute w-[18px] h-[18px] bg-accent rounded-full -translate-x-1/2 cursor-grab active:cursor-grabbing"
								style={{ left: `${leftPct}%` }}
							/>
							<div
								className="absolute w-[18px] h-[18px] bg-accent rounded-full -translate-x-1/2 cursor-grab active:cursor-grabbing"
								style={{ left: `${100 - rightPct}%` }}
							/>
						</div>
						<div className="flex gap-[5px] items-center justify-between mt-[0px]">
							<input
								type="text"
								max={currentYear}
								value={minInput}
								onChange={handleMinInput}
								onBlur={handleMinBlur}
								className="bg-primary-dark/20 outline-none border border-third rounded-full px-[10px] py-[5px] w-[80px] text-[11pt]"
							/>
							<input
								type="text"
								max={currentYear}
								value={maxInput}
								onChange={handleMaxInput}
								onBlur={handleMaxBlur}
								className="bg-primary-dark/20 outline-none border border-third rounded-full px-[10px] py-[5px] w-[80px] text-[11pt]"
							/>
						</div>
						<button
							onClick={handleApply}
							className="bg-accent/90 rounded-full px-[10px] py-[5px] mt-[20px] text-primary-dark text-[11pt] font-[500] cursor-pointer w-full"
						>
							Apply
						</button>
					</div>
				)}
			</div>
		</div>
	);
};

export default FilterBarYearRange;
