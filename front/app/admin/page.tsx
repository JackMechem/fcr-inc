import { redirect } from "next/navigation";
import { getSessionCookies } from "@/app/lib/serverAuth";
import AdminShell from "./AdminShell";

export default async function AdminPage() {
    const { sessionToken, role } = await getSessionCookies();

    if (!sessionToken) {
        redirect("/login?next=/admin");
    }

    if (role && role !== "ADMIN" && role !== "STAFF") {
        redirect("/login?next=/admin");
    }

    return <AdminShell />;
}
