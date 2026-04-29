import { createContext, useContext, RefObject } from "react";

export const BrowseScrollContext = createContext<RefObject<HTMLDivElement | null> | null>(null);

export const useBrowseScrollContainer = () => useContext(BrowseScrollContext);
