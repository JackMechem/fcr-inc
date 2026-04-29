import { createContext, useContext } from "react";
import { UserDashboardView } from "@/stores/userDashboardStore";

export interface PaneContextValue {
    focusedPaneId: string;
    totalPanes: number;
    fullscreenPaneId: string | null;
    onFocus: (paneId: string, view: UserDashboardView) => void;
    onSplit: (paneId: string, dir: "vertical" | "horizontal", newView: UserDashboardView) => void;
    onClose: (paneId: string) => void;
    onSetView: (paneId: string, view: UserDashboardView) => void;
    onResizeSplit: (containerId: string, sizes: number[]) => void;
    onToggleFullscreen: (paneId: string) => void;
}

export const PaneContext = createContext<PaneContextValue>(null!);
export const usePaneContext = () => useContext(PaneContext);
