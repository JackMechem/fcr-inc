import { UserDashboardView } from "@/stores/userDashboardStore";
import { PaneTree } from "./paneTypes";

export function splitLeaf(
    tree: PaneTree,
    paneId: string,
    dir: "vertical" | "horizontal",
    newView: UserDashboardView,
    newLeafId: string,
    containerId: string,
): PaneTree {
    if (tree.type === "leaf") {
        if (tree.id !== paneId) return tree;
        return {
            type: "container",
            id: containerId,
            dir,
            children: [tree, { type: "leaf", id: newLeafId, view: newView }],
            sizes: [1, 1],
        };
    }
    return {
        ...tree,
        children: tree.children.map((c) => splitLeaf(c, paneId, dir, newView, newLeafId, containerId)),
    };
}

export function closeLeaf(tree: PaneTree, paneId: string): PaneTree | null {
    if (tree.type === "leaf") return tree.id === paneId ? null : tree;
    const nextChildren: PaneTree[] = [];
    const nextSizes: number[] = [];
    tree.children.forEach((c, i) => {
        const result = closeLeaf(c, paneId);
        if (result !== null) {
            nextChildren.push(result);
            nextSizes.push(tree.sizes[i]);
        }
    });
    if (nextChildren.length === 0) return null;
    if (nextChildren.length === 1) return nextChildren[0]; // collapse single-child container
    return { ...tree, children: nextChildren, sizes: nextSizes };
}

export function setContainerSizes(tree: PaneTree, containerId: string, sizes: number[]): PaneTree {
    if (tree.type === "leaf") return tree;
    if (tree.id === containerId) return { ...tree, sizes };
    return { ...tree, children: tree.children.map((c) => setContainerSizes(c, containerId, sizes)) };
}

export function updateLeafView(tree: PaneTree, paneId: string, view: UserDashboardView): PaneTree {
    if (tree.type === "leaf") return tree.id === paneId ? { ...tree, view } : tree;
    return { ...tree, children: tree.children.map((c) => updateLeafView(c, paneId, view)) };
}

export function getLeafView(tree: PaneTree, paneId: string): UserDashboardView | null {
    if (tree.type === "leaf") return tree.id === paneId ? tree.view : null;
    for (const c of tree.children) {
        const v = getLeafView(c, paneId);
        if (v) return v;
    }
    return null;
}

export function getFirstLeafId(tree: PaneTree): string {
    if (tree.type === "leaf") return tree.id;
    return getFirstLeafId(tree.children[0]);
}

export function countLeaves(tree: PaneTree): number {
    if (tree.type === "leaf") return 1;
    return tree.children.reduce((sum, c) => sum + countLeaves(c), 0);
}

export function getAllLeafViews(tree: PaneTree): UserDashboardView[] {
    if (tree.type === "leaf") return [tree.view];
    return tree.children.flatMap(getAllLeafViews);
}
