import { describe, expect, it } from "vitest";
import {
  addMonths,
  buildMonthGrid,
  nextSelection,
  rangePosition,
  toISODate,
  weekdayLabels,
} from "./calendarUtils";

describe("toISODate", () => {
  it("formats a local date as YYYY-MM-DD with padding", () => {
    expect(toISODate(new Date(2026, 1, 5))).toBe("2026-02-05");
    expect(toISODate(new Date(2026, 11, 31))).toBe("2026-12-31");
  });
});

describe("addMonths", () => {
  it("wraps across year boundaries", () => {
    expect(addMonths(2026, 11, 1)).toEqual({ year: 2027, monthIndex: 0 });
    expect(addMonths(2026, 0, -1)).toEqual({ year: 2025, monthIndex: 11 });
  });
});

describe("buildMonthGrid", () => {
  // Feb 2026 starts on a Sunday, so with weekStartsOn=0 there are no leading days.
  const grid = buildMonthGrid(2026, 1, 0);

  it("is a fixed 6x7 grid", () => {
    expect(grid).toHaveLength(6);
    expect(grid.every((week) => week.length === 7)).toBe(true);
  });

  it("places the 1st in the first cell when the month starts on the week-start day", () => {
    expect(grid[0][0]).toMatchObject({ iso: "2026-02-01", day: 1, inCurrentMonth: true });
  });

  it("marks trailing days as outside the current month", () => {
    const last = grid[5][6];
    expect(last.inCurrentMonth).toBe(false); // spills into March
  });

  it("respects weekStartsOn (Monday pushes a Sunday-start month by 6 leading days)", () => {
    const monGrid = buildMonthGrid(2026, 1, 1);
    expect(monGrid[0][0].inCurrentMonth).toBe(false); // leading day from January
    expect(monGrid[0][6]).toMatchObject({ iso: "2026-02-01", inCurrentMonth: true });
  });
});

describe("rangePosition", () => {
  it("returns single for a one-day range", () => {
    expect(rangePosition("2026-02-10", "2026-02-10", null)).toBe("single");
    expect(rangePosition("2026-02-10", "2026-02-10", "2026-02-10")).toBe("single");
  });

  it("labels start, middle, and end across a span", () => {
    expect(rangePosition("2026-02-10", "2026-02-10", "2026-02-12")).toBe("start");
    expect(rangePosition("2026-02-11", "2026-02-10", "2026-02-12")).toBe("middle");
    expect(rangePosition("2026-02-12", "2026-02-10", "2026-02-12")).toBe("end");
  });

  it("returns null outside the range", () => {
    expect(rangePosition("2026-02-09", "2026-02-10", "2026-02-12")).toBeNull();
    expect(rangePosition("2026-02-13", "2026-02-10", "2026-02-12")).toBeNull();
  });

  it("tolerates reversed bounds", () => {
    expect(rangePosition("2026-02-11", "2026-02-12", "2026-02-10")).toBe("middle");
  });
});

describe("weekdayLabels", () => {
  it("orders by week start", () => {
    expect(weekdayLabels(0)[0]).toBe("Sun");
    expect(weekdayLabels(1)[0]).toBe("Mon");
    expect(weekdayLabels(1)).toHaveLength(7);
  });
});

describe("nextSelection", () => {
  it("starts a selection from an empty state", () => {
    expect(nextSelection(null, "2026-02-10")).toEqual({
      selection: { start: "2026-02-10", end: null },
      completed: null,
    });
  });

  it("completes the range when tapping a later day", () => {
    const result = nextSelection({ start: "2026-02-10", end: null }, "2026-02-14");
    expect(result.selection).toEqual({ start: "2026-02-10", end: "2026-02-14" });
    expect(result.completed).toEqual({ start: "2026-02-10", end: "2026-02-14" });
  });

  it("treats tapping the same day as a one-day range", () => {
    const result = nextSelection({ start: "2026-02-10", end: null }, "2026-02-10");
    expect(result.completed).toEqual({ start: "2026-02-10", end: "2026-02-10" });
  });

  it("replaces the start when tapping an earlier day", () => {
    const result = nextSelection({ start: "2026-02-10", end: null }, "2026-02-06");
    expect(result.selection).toEqual({ start: "2026-02-06", end: null });
    expect(result.completed).toBeNull();
  });

  it("starts fresh after a completed range", () => {
    const result = nextSelection({ start: "2026-02-10", end: "2026-02-14" }, "2026-02-20");
    expect(result.selection).toEqual({ start: "2026-02-20", end: null });
    expect(result.completed).toBeNull();
  });
});
