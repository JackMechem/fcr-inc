import { UserDashboardView } from "@/stores/userDashboardStore";

export type PaneLeaf = {
    type: "leaf";
    id: string;
    view: UserDashboardView;
};

export type PaneContainer = {
    type: "container";
    id: string;
    dir: "vertical" | "horizontal";
    children: PaneTree[];
    sizes: number[]; // flex ratios, same length as children
};

export type PaneTree = PaneLeaf | PaneContainer;
