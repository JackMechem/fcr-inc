import { create } from "zustand";

interface MobileSidebarStore {
    open: boolean;
    setOpen: (open: boolean) => void;
}

export const useMobileSidebarStore = create<MobileSidebarStore>()((set) => ({
    open: false,
    setOpen: (open) => set({ open }),
}));
