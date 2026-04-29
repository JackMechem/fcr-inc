import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PaneTree } from "@/app/dashboard/components/layout/paneTypes";
import { splitLeaf } from "@/app/dashboard/components/layout/paneUtils";
import { UserDashboardView } from "./userDashboardStore";

export interface PaneTab {
    id: string;
    name: string;
    paneTree: PaneTree;
    focusedPaneId: string;
}

interface PaneTabStore {
    tabs: PaneTab[];
    activeTabId: string;
    addTab: (defaultView: UserDashboardView) => void;
    removeTab: (id: string) => void;
    setActiveTab: (id: string) => void;
    updateActiveTab: (patch: Partial<Pick<PaneTab, "paneTree" | "focusedPaneId">>) => void;
    renameTab: (id: string, name: string) => void;
    splitFocusedPane: (dir: "vertical" | "horizontal", newView: UserDashboardView) => void;
}

function makeId() { return Math.random().toString(36).slice(2, 9); }

function defaultTab(view: UserDashboardView, name: string): PaneTab {
    const rootId = makeId();
    return {
        id: makeId(),
        name,
        paneTree: { type: "leaf", id: rootId, view },
        focusedPaneId: rootId,
    };
}

export const usePaneTabStore = create<PaneTabStore>()(
    persist(
        (set, get) => ({
            tabs: [defaultTab("admin-dashboard", "Tab 1")],
            activeTabId: "",

            addTab: (defaultView) => {
                const tab = defaultTab(defaultView, `Tab ${get().tabs.length + 1}`);
                set((s) => ({ tabs: [...s.tabs, tab], activeTabId: tab.id }));
            },

            removeTab: (id) => {
                const { tabs, activeTabId } = get();
                if (tabs.length <= 1) return;
                const idx = tabs.findIndex((t) => t.id === id);
                const next = tabs.filter((t) => t.id !== id);
                const newActive = id === activeTabId
                    ? next[Math.max(0, idx - 1)].id
                    : activeTabId;
                set({ tabs: next, activeTabId: newActive });
            },

            setActiveTab: (id) => set({ activeTabId: id }),

            updateActiveTab: (patch) => {
                const { tabs, activeTabId } = get();
                set({
                    tabs: tabs.map((t) => t.id === activeTabId ? { ...t, ...patch } : t),
                });
            },

            renameTab: (id, name) => {
                set((s) => ({ tabs: s.tabs.map((t) => t.id === id ? { ...t, name } : t) }));
            },

            splitFocusedPane: (dir, newView) => {
                const { tabs, activeTabId } = get();
                const tab = tabs.find((t) => t.id === activeTabId);
                if (!tab) return;
                const newTree = splitLeaf(
                    tab.paneTree,
                    tab.focusedPaneId,
                    dir,
                    newView,
                    makeId(),
                    makeId(),
                );
                set({ tabs: tabs.map((t) => t.id === activeTabId ? { ...t, paneTree: newTree } : t) });
            },
        }),
        {
            name: "pane-tabs",
            onRehydrateStorage: () => (state) => {
                if (!state) return;
                // Ensure activeTabId points to a valid tab
                if (!state.tabs.find((t) => t.id === state.activeTabId)) {
                    state.activeTabId = state.tabs[0]?.id ?? "";
                }
            },
        }
    )
);
