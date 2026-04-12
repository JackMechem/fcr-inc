import { ReactNode } from "react";

interface SpecGroupProps {
	title: string;
	children: ReactNode;
}

const SpecGroup = ({ title, children }: SpecGroupProps) => (
	<div className="flex flex-col gap-[10px] w-fit shrink-0">
		<p className="text-[8pt] font-[700] uppercase tracking-widest text-foreground-light/60">
			{title}
		</p>
		<div className="flex flex-row flex-wrap gap-[16px]">
			{children}
		</div>
	</div>
);

export default SpecGroup;
