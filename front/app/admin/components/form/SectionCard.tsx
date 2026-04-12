interface SectionCardProps {
	title: string;
	children: React.ReactNode;
	action?: React.ReactNode;
}

const SectionCard = ({ title, children, action }: SectionCardProps) => (
	<div className="bg-primary border border-third/60 rounded-2xl p-[20px] flex flex-col gap-[16px]">
		<div className="flex items-center justify-between pb-[4px] border-b border-third/50">
			<p className="text-foreground text-[11pt] font-[600]">{title}</p>
			{action}
		</div>
		{children}
	</div>
);

export default SectionCard;
