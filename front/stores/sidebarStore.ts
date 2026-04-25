import { create } from "zustand";
import { CarEnums } from "@/app/types/CarEnums";

type Panel = "menu" | "filter" | "devConsole" | null;

interface SidebarStore {
    openPanel: Panel;
    filterEnums: CarEnums | null;
    makes: string[] | null;
    openMenu: () => void;
    openFilter: () => void;
    openDevConsole: () => void;
    close: () => void;
    toggleMenu: () => void;
    toggleFilter: () => void;
    toggleDevConsole: () => void;
    registerEnums: (enums: CarEnums) => void;
    registerMakes: (makes: string[]) => void;
}

export const useSidebarStore = create<SidebarStore>((set, get) => ({
    openPanel: null,
    filterEnums: null,
    makes: null,
    openMenu: () => set({ openPanel: "menu" }),
    openFilter: () => set({ openPanel: "filter" }),
    openDevConsole: () => set({ openPanel: "devConsole" }),
    close: () => set({ openPanel: null }),
    toggleMenu: () => set({ openPanel: get().openPanel === "menu" ? null : "menu" }),
    toggleFilter: () => set({ openPanel: get().openPanel === "filter" ? null : "filter" }),
    toggleDevConsole: () => set({ openPanel: get().openPanel === "devConsole" ? null : "devConsole" }),
    registerEnums: (enums) => set({ filterEnums: enums }),
    registerMakes: (makes) => set({ makes }),
}));
