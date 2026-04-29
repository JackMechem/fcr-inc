import { create } from "zustand";

interface BrowsePreviewStore {
    previewOpen: boolean;
    selectedVin: string | null;
    setPreviewOpen: (open: boolean) => void;
    setSelectedVin: (vin: string | null) => void;
}

export const useBrowsePreviewStore = create<BrowsePreviewStore>((set) => ({
    previewOpen: false,
    selectedVin: null,
    setPreviewOpen: (previewOpen) => set({ previewOpen }),
    setSelectedVin: (selectedVin) => set({ selectedVin }),
}));
