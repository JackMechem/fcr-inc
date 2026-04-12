import { ReactNode } from "react";

interface SpecGroupProps {
	title: string;
	children: ReactNode;
}

const SpecGroup = ({ title, children }: SpecGroupProps) => (
	<div className="flex flex-col gap-[12px]">
		<p className="text-[8pt] font-[700] uppercase tracking-widest text-foreground-light/60">
			{title}
		</p>
		<div className="grid sm:grid-cols-3 grid-cols-2 gap-x-[24px] gap-y-[14px]">
			{children}
		</div>
	</div>
);

export default SpecGroup;
