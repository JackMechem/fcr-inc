import { create } from "zustand";

export interface RequestLog {
    id: string;
    method: string;
    url: string;
    backendUrl: string;
    status: number | null;
    requestBody: unknown;
    responseBody: unknown;
    timestamp: Date;
    duration: number | null;
    error?: string;
}

interface DevConsoleStore {
    logs: RequestLog[];
    panelWidth: number;
    addLog: (log: RequestLog) => void;
    clearLogs: () => void;
    setPanelWidth: (w: number) => void;
}

export const useDevConsoleStore = create<DevConsoleStore>((set) => ({
    logs: [],
    panelWidth: 520,
    addLog: (log) =>
        set((state) => ({ logs: [log, ...state.logs].slice(0, 300) })),
    clearLogs: () => set({ logs: [] }),
    setPanelWidth: (w) => set({ panelWidth: w }),
}));
