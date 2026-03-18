"use client";

interface PillOption {
    paramId: string;
    displayText: string;
}

interface PillSelectProps {
    options: PillOption[];
    selected?: string;
    onChange: (value: string | null) => void;
}

const PillSelect = ({ options, selected, onChange }: PillSelectProps) => {
    return (
        <div className="flex flex-wrap gap-[10px]">
            {options.map((opt) => (
                <button
                    key={opt.paramId}
                    onClick={() => onChange(selected === opt.paramId ? null : opt.paramId)}
                    className={`px-[14px] py-[8px] rounded-full border text-[10pt] transition-colors ${
                        selected === opt.paramId
                            ? "border-foreground bg-foreground text-primary font-[500]"
                            : "border-third text-foreground hover:border-foreground"
                    }`}
                >
                    {opt.displayText}
                </button>
            ))}
        </div>
    );
};

export default PillSelect;

