"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

interface MarkdownEditorProps {
	value: string;
	onChange: (v: string) => void;
}

const MarkdownEditor = ({ value, onChange }: MarkdownEditorProps) => {
	const [tab, setTab] = useState<"write" | "preview">("write");

	return (
		<div className="flex flex-col gap-0 rounded-xl overflow-hidden border border-third focus-within:border-accent/60 transition">
			{/* Tab bar */}
			<div className="flex border-b border-third bg-primary-dark/30">
				{(["write", "preview"] as const).map((t) => (
					<button
						key={t}
						type="button"
						onClick={() => setTab(t)}
						className={`px-[16px] py-[8px] text-[9pt] font-[600] uppercase tracking-wider transition-colors cursor-pointer ${
							tab === t
								? "text-accent border-b-2 border-accent -mb-[1px] bg-primary"
								: "text-foreground-light hover:text-foreground"
						}`}
					>
						{t}
					</button>
				))}
			</div>

			{/* Write */}
			{tab === "write" && (
				<textarea
					className="w-full bg-primary px-[14px] py-[10px] text-[10.5pt] text-foreground placeholder:text-foreground-light/60 focus:outline-none resize-none h-[180px] font-mono"
					placeholder="Describe the vehicle — supports **markdown**…"
					value={value}
					onChange={(e) => onChange(e.target.value)}
				/>
			)}

			{/* Preview */}
			{tab === "preview" && (
				<div
					className="min-h-[180px] px-[16px] py-[12px] bg-primary prose prose-sm prose-invert max-w-none
					[&_h1]:text-foreground [&_h1]:text-[14pt] [&_h1]:font-[700] [&_h1]:mb-[8px]
					[&_h2]:text-foreground [&_h2]:text-[12pt] [&_h2]:font-[600] [&_h2]:mb-[6px]
					[&_h3]:text-foreground [&_h3]:text-[11pt] [&_h3]:font-[600]
					[&_p]:text-foreground [&_p]:text-[10.5pt] [&_p]:leading-[1.6] [&_p]:mb-[8px]
					[&_strong]:text-foreground [&_strong]:font-[600]
					[&_em]:text-foreground-light
					[&_ul]:text-foreground [&_ul]:list-disc [&_ul]:pl-[20px] [&_ul]:mb-[8px]
					[&_ol]:text-foreground [&_ol]:list-decimal [&_ol]:pl-[20px] [&_ol]:mb-[8px]
					[&_li]:text-[10.5pt] [&_li]:mb-[2px]
					[&_a]:text-accent [&_a]:underline
					[&_code]:bg-third/40 [&_code]:text-accent [&_code]:px-[6px] [&_code]:py-[1px] [&_code]:rounded [&_code]:text-[9.5pt]
					[&_pre]:bg-third/40 [&_pre]:rounded-xl [&_pre]:p-[12px] [&_pre]:overflow-x-auto
					[&_blockquote]:border-l-2 [&_blockquote]:border-accent/50 [&_blockquote]:pl-[12px] [&_blockquote]:text-foreground-light
					[&_hr]:border-third/50"
				>
					{value.trim() ? (
						<ReactMarkdown>{value}</ReactMarkdown>
					) : (
						<p className="text-foreground-light/50 text-[10.5pt] italic">
							Nothing to preview yet.
						</p>
					)}
				</div>
			)}
		</div>
	);
};

export default MarkdownEditor;
