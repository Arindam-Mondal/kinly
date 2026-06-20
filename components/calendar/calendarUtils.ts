// Pure, timezone-safe calendar helpers. Dates are handled as 'YYYY-MM-DD' strings,
// which compare and sort correctly with plain string operators.

export type GridDay = { iso: string; day: number; inCurrentMonth: boolean };
export type RangePosition = "single" | "start" | "middle" | "end";

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayISO(now: Date = new Date()): string {
  return toISODate(now);
}

// Step `delta` whole months from (year, monthIndex), normalizing the result.
export function addMonths(year: number, monthIndex: number, delta: number) {
  const d = new Date(year, monthIndex + delta, 1);
  return { year: d.getFullYear(), monthIndex: d.getMonth() };
}

export function monthLabel(year: number, monthIndex: number): string {
  return new Date(year, monthIndex, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

// 'YYYY-MM-DD' -> e.g. "Jun 10, 2026", built from parts to avoid UTC parsing shifts.
export function formatHuman(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Fixed 6-row grid (42 days) including leading/trailing days from adjacent months,
// so the layout never jumps between months.
export function buildMonthGrid(year: number, monthIndex: number, weekStartsOn = 0): GridDay[][] {
  const first = new Date(year, monthIndex, 1);
  const leading = (first.getDay() - weekStartsOn + 7) % 7;
  const start = new Date(year, monthIndex, 1 - leading);

  const weeks: GridDay[][] = [];
  for (let w = 0; w < 6; w++) {
    const week: GridDay[] = [];
    for (let d = 0; d < 7; d++) {
      const current = new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + d);
      week.push({
        iso: toISODate(current),
        day: current.getDate(),
        inCurrentMonth: current.getMonth() === monthIndex,
      });
    }
    weeks.push(week);
  }
  return weeks;
}

// Where `iso` sits within an inclusive [startISO, endISO] range, or null if outside.
// Tolerates start/end given in either order.
export function rangePosition(
  iso: string,
  startISO: string,
  endISO: string | null,
): RangePosition | null {
  if (!endISO) return iso === startISO ? "single" : null;
  const [lo, hi] = startISO <= endISO ? [startISO, endISO] : [endISO, startISO];
  if (iso < lo || iso > hi) return null;
  if (lo === hi) return "single";
  if (iso === lo) return "start";
  if (iso === hi) return "end";
  return "middle";
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function weekdayLabels(weekStartsOn = 0): string[] {
  return [...WEEKDAYS.slice(weekStartsOn), ...WEEKDAYS.slice(0, weekStartsOn)];
}

export type Selection = { start: string; end: string | null };
export type SelectionResult = {
  selection: Selection;
  completed: { start: string; end: string } | null;
};

// Pure tap-to-select state machine (tech spec §5.5):
// 1) nothing pending -> the tapped day becomes the start
// 2) a start pending + tap on/after it -> completes the range (same day = 1-day period)
// 3) a start pending + tap before it -> the earlier day replaces the start
// 4) a completed range + any tap -> starts a fresh selection
export function nextSelection(current: Selection | null, iso: string): SelectionResult {
  if (!current || current.end !== null) {
    return { selection: { start: iso, end: null }, completed: null };
  }
  if (iso < current.start) {
    return { selection: { start: iso, end: null }, completed: null };
  }
  return {
    selection: { start: current.start, end: iso },
    completed: { start: current.start, end: iso },
  };
}
