import { Car } from "@/app/types/CarTypes";

export interface ConflictRange {
    from: number; // unix seconds
    to: number;
}

export interface AvailabilityResult {
    status: "available" | "partial" | "unavailable" | null;
    conflicts: ConflictRange[];
}

export function getAvailability(
    car: Car,
    fromDateStr: string | undefined,
    untilDateStr: string | undefined,
): AvailabilityResult {
    if (!fromDateStr || !untilDateStr) return { status: null, conflicts: [] };

    const from = new Date(fromDateStr).getTime() / 1000;
    const until = new Date(untilDateStr).getTime() / 1000;

    const reservations = car.reservationDates ?? [];
    if (reservations.length === 0) return { status: "available", conflicts: [] };

    const overlapping = reservations.filter(([s, e]) => from < e && until > s);
    if (overlapping.length === 0) return { status: "available", conflicts: [] };

    // Clip conflicts to the selected range for display
    const conflicts: ConflictRange[] = overlapping.map(([s, e]) => ({
        from: Math.max(s, from),
        to: Math.min(e, until),
    }));

    // Check if the union of overlapping reservations fully covers [from, until]
    const sorted = [...overlapping].sort(([a], [b]) => a - b);
    let covered = from;
    for (const [s, e] of sorted) {
        if (s > covered) break; // gap — not fully covered
        covered = Math.max(covered, e);
    }

    return {
        status: covered >= until ? "unavailable" : "partial",
        conflicts,
    };
}

export function formatConflicts(conflicts: ConflictRange[]): string {
    const fmt = (ts: number) =>
        new Date(ts * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return conflicts.map(({ from, to }) => `${fmt(from)} – ${fmt(to)}`).join(" · ");
}
