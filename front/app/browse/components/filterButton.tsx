"use client";
import { useEffect } from "react";
import { VscSettings } from "react-icons/vsc";
import { useSidebarStore } from "@/stores/sidebarStore";
import { useFilterParams } from "./useFilterParams";
import { CarEnums } from "@/app/types/CarEnums";
import styles from "./browseBar.module.css";

const SKIP = new Set([
    "page", "pageSize", "sortBy", "sortDir", "select",
    "layout", "search", "fromDate", "untilDate",
]);

interface FilterButtonProps {
    enums: CarEnums;
    makes: string[];
}

const FilterButton = ({ enums, makes }: FilterButtonProps) => {
    const { toggleFilter, registerEnums, registerMakes } = useSidebarStore();
    const { params } = useFilterParams();

    useEffect(() => {
        registerEnums(enums);
        registerMakes(makes);
    }, [enums, makes]);

    const hasActiveFilters = Object.keys(params).some((k) => !SKIP.has(k));

    return (
        <div className={styles.filterBtnWrapper}>
            <button onClick={toggleFilter} className={styles.filterBtn}>
                <VscSettings />
            </button>
            {hasActiveFilters && <span className={styles.filterActiveDot} />}
        </div>
    );
};

export default FilterButton;
