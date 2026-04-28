/**
 * Module-level store for "jump to" search state when navigating between
 * dashboard views via "Go to reference". Written before setActiveView(),
 * consumed once by the target panel on mount.
 */
const pending: Record<string, string> = {};

export function setPendingJump(view: string, search: string) {
    pending[view] = search;
}

export function consumePendingJump(view: string): string | null {
    const s = pending[view] ?? null;
    delete pending[view];
    return s;
}
