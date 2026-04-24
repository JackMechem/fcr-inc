"use client";

import { useUserDashboardStore } from "@/stores/userDashboardStore";
import { BiEdit } from "react-icons/bi";
import Link from "next/link";
import styles from "../carDetail.module.css";

export default function EditCarButton({ vin }: { vin: string }) {
    const role = useUserDashboardStore((s) => s.role);

    if (role !== "ADMIN" && role !== "STAFF") return null;

    return (
        <Link href={`/dashboard?editcar=${vin}`} className={styles.editCarBtn}>
            <BiEdit />
            Edit Car
        </Link>
    );
}
