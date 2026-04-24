import { ReactNode } from "react";
import styles from "../carDetail.module.css";

const CarProperty = ({ children }: { children: ReactNode }) => {
	return <div className={styles.carProperty}>{children}</div>;
};

export default CarProperty;
