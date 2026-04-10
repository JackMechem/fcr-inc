import { create } from "zustand";
import { CarEnums } from "@/app/types/CarEnums";

type Panel = "menu" | "filter" | null;

interface SidebarStore {
    openPanel: Panel;
    filterEnums: CarEnums | null;
    openMenu: () => void;
    openFilter: () => void;
    close: () => void;
    toggleMenu: () => void;
    toggleFilter: () => void;
    registerEnums: (enums: CarEnums) => void;
}

export const useSidebarStore = create<SidebarStore>((set, get) => ({
    openPanel: null,
    filterEnums: null,
    openMenu: () => set({ openPanel: "menu" }),
    openFilter: () => set({ openPanel: "filter" }),
    close: () => set({ openPanel: null }),
    toggleMenu: () => set({ openPanel: get().openPanel === "menu" ? null : "menu" }),
    toggleFilter: () => set({ openPanel: get().openPanel === "filter" ? null : "filter" }),
    registerEnums: (enums) => set({ filterEnums: enums }),
}));
