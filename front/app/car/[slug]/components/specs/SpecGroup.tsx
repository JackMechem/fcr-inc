import { ReactNode } from "react";
import styles from "../carDetail.module.css";

interface SpecGroupProps {
	title: string;
	children: ReactNode;
}

const SpecGroup = ({ title, children }: SpecGroupProps) => (
	<div className={styles.specGroup}>
		<p className={styles.specGroupTitle}>{title}</p>
		<div className={styles.specGroupItems}>{children}</div>
	</div>
);

export default SpecGroup;
