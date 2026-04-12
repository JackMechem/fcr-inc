import { PiSparkleFill } from "react-icons/pi";

interface AiButtonProps {
	onClick: () => void;
	loading: boolean;
}

const AiButton = ({ onClick, loading }: AiButtonProps) => (
	<button
		type="button"
		onClick={onClick}
		disabled={loading}
		title="Fill with AI"
		className="flex-shrink-0 flex items-center gap-[4px] px-[10px] py-[6px] rounded-lg bg-accent/10 hover:bg-accent/20 text-accent text-[9pt] font-[500] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait whitespace-nowrap"
	>
		<PiSparkleFill className={`text-[11pt] ${loading ? "animate-pulse" : ""}`} />
		{loading ? "…" : "AI"}
	</button>
);

export default AiButton;
