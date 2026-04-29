import { getSessionCookies } from "@/app/lib/serverAuth";
import NavHeader from "../components/headers/navHeader";
import UserSidebar from "./components/layout/UserSidebar";
import MagicLinkPromptPage from "./components/panels/MagicLinkPromptPage";
import DashboardContentArea from "./components/layout/DashboardContentArea";
import DashboardShell from "./components/layout/DashboardShell";
import MobileMenuButton from "../components/buttons/MobileMenuButton";

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ payment?: string; editcar?: string }>;
}) {
    const { sessionToken } = await getSessionCookies();
    const sp = await searchParams;
    const editCarVin = sp?.editcar;

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
            <NavHeader white={false} mobileMenuTrigger={<MobileMenuButton />} />
            <UserSidebar />
            <DashboardContentArea />
        </>
    );
}
