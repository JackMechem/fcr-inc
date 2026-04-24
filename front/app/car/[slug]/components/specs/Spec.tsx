import { ReactNode } from "react";
import styles from "../carDetail.module.css";

interface SpecProps {
	icon: ReactNode;
	label: string;
	value: string | number;
}

const Spec = ({ icon, label, value }: SpecProps) => (
	<div className={styles.spec}>
		<span className={styles.specIcon}>{icon}</span>
		<div>
			<p className={styles.specLabel}>{label}</p>
			<p className={styles.specValue}>{value}</p>
		</div>
	</div>
);

export default Spec;
