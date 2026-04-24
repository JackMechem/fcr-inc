import { ReactNode } from "react";
import styles from "../carDetail.module.css";

const CarFeature = ({ children }: { children: ReactNode }) => {
	return <div className={styles.carFeature}>{children}</div>;
};

export default CarFeature;
