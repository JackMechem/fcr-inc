"use client";

import { useRouter } from "next/navigation";
import { BiChevronLeft } from "react-icons/bi";
import styles from "./browseBackButton.module.css";

const BackButton = ({ iconOnly = false }: { iconOnly?: boolean }) => {
    const router = useRouter();
    return (
        <button
            onClick={() => router.back()}
            className={iconOnly ? styles.browseBackBtnIcon : styles.browseBackBtn}
            aria-label="Back to browse"
        >
            <BiChevronLeft />
            {!iconOnly && "Browse"}
        </button>
    );
};

export default BackButton;
