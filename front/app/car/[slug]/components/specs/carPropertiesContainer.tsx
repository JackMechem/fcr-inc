import { ReactNode } from "react";
import styles from "../carDetail.module.css";

const CarPropertiesContainer = ({ children }: { children: ReactNode }) => {
	return <div className={styles.carPropertiesContainer}>{children}</div>;
};

export default CarPropertiesContainer;
