import FilterButton from "./filterButton";
import ActiveFilters from "./activeFilters";
import SortButtons from "./sortButtons";
import { getFilterBarData } from "../../actions";
import styles from "./browseBar.module.css";

const FilterBar = async () => {
    const { enums, makes } = await getFilterBarData();

	return (
		<div className={styles.filterBar}>
            <ActiveFilters className="self-center h-full" />
			<div className={styles.filterBarRight}>
                <SortButtons />
				<FilterButton enums={enums} makes={makes} />
			</div>
		</div>
	);
};

export default FilterBar;
