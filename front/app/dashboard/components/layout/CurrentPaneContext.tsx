import { createContext, useContext } from "react";

export interface CurrentPaneValue {
    paneId: string;
    totalPanes: number;
}

export const CurrentPaneContext = createContext<CurrentPaneValue | null>(null);
export const useCurrentPane = () => useContext(CurrentPaneContext);
