"use client";
import { useEffect } from "react";
import { VscSettings } from "react-icons/vsc";
import { useSidebarStore } from "@/stores/sidebarStore";
import { CarEnums } from "@/app/types/CarEnums";

interface FilterButtonProps {
    enums: CarEnums;
}

const FilterButton = ({ enums }: FilterButtonProps) => {
    const { toggleFilter, registerEnums } = useSidebarStore();

    useEffect(() => {
        registerEnums(enums);
    }, [enums]);

    return (
        <button
            onClick={toggleFilter}
            className="text-[20pt] text-accent/80 border border-transparent cursor-pointer hover:bg-primary-dark hover:border-third/70 rounded-2xl text-center px-[15px] h-full py-2"
        >
            <VscSettings />
        </button>
    );
};

export default FilterButton;
