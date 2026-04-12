export const labelCls =
	"block text-[8pt] font-[600] uppercase tracking-wider text-foreground-light mb-[6px]";

export const inputCls =
	"w-full bg-primary border border-third rounded-xl px-[14px] py-[10px] text-[10.5pt] text-foreground placeholder:text-foreground-light/60 focus:outline-none focus:border-accent/60 transition";

export const selectCls =
	"w-full bg-primary border border-third rounded-xl px-[14px] py-[10px] text-[10.5pt] text-foreground focus:outline-none focus:border-accent/60 transition cursor-pointer";

interface FieldProps {
	label: string;
	children: React.ReactNode;
}

const Field = ({ label, children }: FieldProps) => (
	<div>
		<label className={labelCls}>{label}</label>
		{children}
	</div>
);

export default Field;
