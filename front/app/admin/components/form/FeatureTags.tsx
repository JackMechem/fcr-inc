"use client";

import { useState } from "react";
import { BiX } from "react-icons/bi";
import { inputCls } from "./Field";

interface FeatureTagsProps {
	features: string[];
	onChange: (tags: string[]) => void;
}

const FeatureTags = ({ features, onChange }: FeatureTagsProps) => {
	const [input, setInput] = useState("");

	const add = () => {
		const trimmed = input.trim();
		if (trimmed && !features.includes(trimmed)) {
			onChange([...features, trimmed]);
		}
		setInput("");
	};

	const remove = (tag: string) => onChange(features.filter((f) => f !== tag));

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			add();
		}
		if (e.key === "Backspace" && input === "" && features.length > 0) {
			remove(features[features.length - 1]);
		}
	};

	return (
		<div className="flex flex-col gap-[8px]">
			<div
				className={`${inputCls} flex flex-wrap gap-[6px] items-center min-h-[44px] h-auto py-[8px] cursor-text`}
				onClick={(e) =>
					(e.currentTarget.querySelector("input") as HTMLInputElement)?.focus()
				}
			>
				{features.map((tag, index: number) => (
					<span
						key={tag + index.toString()}
						className="flex items-center gap-[4px] bg-accent/10 text-accent text-[9.5pt] font-[500] px-[10px] py-[3px] rounded-full"
					>
						{tag}
						<button
							type="button"
							onClick={() => remove(tag)}
							className="cursor-pointer hover:text-accent/60 transition-colors leading-none"
						>
							<BiX className="text-[11pt]" />
						</button>
					</span>
				))}
				<input
					className="outline-none bg-transparent text-foreground text-[10.5pt] placeholder:text-foreground-light/60 flex-1 min-w-[140px]"
					placeholder={
						features.length === 0
							? "e.g. Heated seats — press Enter to add"
							: "Add another…"
					}
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={handleKeyDown}
					onBlur={add}
				/>
			</div>
		</div>
	);
};

export default FeatureTags;
