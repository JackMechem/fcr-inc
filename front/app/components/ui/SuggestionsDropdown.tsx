import { BiSearch } from "react-icons/bi";
import type { Suggestion } from "@/app/hooks/useSearchSuggestions";

interface SuggestionsDropdownProps {
	suggestions: Suggestion[];
	loading: boolean;
	highlightedIndex: number;
	onSelect: (s: Suggestion) => void;
	onHover: (index: number) => void;
}

/**
 * Shared autocomplete dropdown used by the landing search bar and the nav header.
 * Rendered as an `absolute`-positioned element — the parent must be `relative`.
 */
const SuggestionsDropdown = ({
	suggestions,
	loading,
	highlightedIndex,
	onSelect,
	onHover,
}: SuggestionsDropdownProps) => (
	<div className="absolute top-full left-0 right-0 mt-2 bg-primary border border-third rounded-2xl shadow-xl overflow-hidden z-50">
		{loading ? (
			<div className="flex items-center justify-center py-[14px]">
				<div className="w-[18px] h-[18px] rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
			</div>
		) : (
			suggestions.map((s, i) => (
				<button
					key={s.vin}
					onMouseDown={(e) => {
						e.preventDefault();
						onSelect(s);
					}}
					onMouseEnter={() => onHover(i)}
					onMouseLeave={() => onHover(-1)}
					className={`w-full text-left px-[16px] py-[10px] text-foreground text-[11pt] flex items-center gap-2 duration-100 cursor-pointer ${
						highlightedIndex === i ? "bg-accent/10" : "hover:bg-accent/10"
					}`}
				>
					<BiSearch className="text-foreground/40 flex-shrink-0" />
					<span>
						{s.make} {s.model}
					</span>
				</button>
			))
		)}
	</div>
);

export default SuggestionsDropdown;
