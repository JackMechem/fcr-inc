import { getSessionCookies } from "@/app/lib/serverAuth";
import NavHeader from "../components/headers/navHeader";
import UserSidebar from "./components/UserSidebar";
import MagicLinkPromptPage from "./components/MagicLinkPromptPage";
import DashboardContentArea from "./DashboardContentArea";
import DashboardShell from "./DashboardShell";

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ payment?: string }>;
}) {
    const { sessionToken } = await getSessionCookies();
    const sp = await searchParams;

    if (!sessionToken) {
        return (
            <>
                <NavHeader white={false} />
                <MagicLinkPromptPage />
            </>
        );
    }

    return (
        <>
            <NavHeader white={false} />
            <UserSidebar />
            <DashboardContentArea>
                <DashboardShell paymentSuccess={sp?.payment === "success"} />
            </DashboardContentArea>
        </>
    );
}
