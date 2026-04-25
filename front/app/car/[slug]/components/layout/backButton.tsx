"use client";

import { useRouter } from "next/navigation";
import { BiChevronLeft } from "react-icons/bi";
import styles from "./browseBackButton.module.css";

const BackButton = () => {
    const router = useRouter();
    return (
        <button onClick={() => router.back()} className={styles.browseBackBtn}>
            <BiChevronLeft className={styles.browseBackBtnIcon} />
            Browse
        </button>
    );
};

export default BackButton;
