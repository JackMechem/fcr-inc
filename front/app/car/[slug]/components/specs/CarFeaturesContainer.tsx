import { ReactNode } from "react";
import styles from "../carDetail.module.css";

const CarFeaturesContainer = ({ children }: { children: ReactNode }) => {
	return <div className={styles.carFeaturesContainer}>{children}</div>;
};

export default CarFeaturesContainer;
