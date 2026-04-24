"use client";

import { useRouter } from "next/navigation";
import { BiChevronLeft } from "react-icons/bi";
import styles from "../carDetail.module.css";

const BackButton = () => {
    const router = useRouter();
    return (
        <button onClick={() => router.back()} className={styles.backBtn}>
            <BiChevronLeft className={styles.backBtnIcon} />
            Back
        </button>
    );
};

export default BackButton;
