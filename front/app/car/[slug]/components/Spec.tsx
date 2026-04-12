import { ReactNode } from "react";

interface SpecProps {
	icon: ReactNode;
	label: string;
	value: string | number;
}

const Spec = ({ icon, label, value }: SpecProps) => (
	<div className="flex items-center gap-[10px]">
		<span className="text-accent text-[18pt] flex-shrink-0">{icon}</span>
		<div>
			<p className="text-[7.5pt] font-[700] uppercase tracking-wider text-foreground-light leading-none mb-[2px]">
				{label}
			</p>
			<p className="text-foreground text-[10.5pt] font-[500]">{value}</p>
		</div>
	</div>
);

export default Spec;
