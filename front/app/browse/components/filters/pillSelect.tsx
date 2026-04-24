"use client";

import styles from "./pillSelect.module.css";

interface PillOption {
    paramId: string;
    displayText: string;
}

interface PillSelectProps {
    options: PillOption[];
    // single-select mode
    selected?: string;
    onChange?: (value: string | null) => void;
    // multi-select mode
    selectedValues?: string[];
    onChangeMulti?: (values: string[]) => void;
}

const PillSelect = ({ options, selected, onChange, selectedValues, onChangeMulti }: PillSelectProps) => {
    const isMulti = onChangeMulti !== undefined;

    const handleClick = (paramId: string) => {
        if (isMulti && selectedValues !== undefined) {
            const next = selectedValues.includes(paramId)
                ? selectedValues.filter((v) => v !== paramId)
                : [...selectedValues, paramId];
            onChangeMulti(next);
        } else if (onChange) {
            onChange(selected === paramId ? null : paramId);
        }
    };

    const isActive = (paramId: string) => {
        if (isMulti && selectedValues !== undefined) return selectedValues.includes(paramId);
        return selected === paramId;
    };

    return (
        <div className={styles.pillGroup}>
            {options.map((opt) => (
                <button
                    key={opt.paramId}
                    onClick={() => handleClick(opt.paramId)}
                    className={`${styles.pill} ${isActive(opt.paramId) ? styles.pillActive : ""}`}
                >
                    {opt.displayText}
                </button>
            ))}
        </div>
    );
};

export default PillSelect;
