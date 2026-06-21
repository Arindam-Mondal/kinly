import { describe, expect, it } from "vitest";
import { type PeriodForInsights, computePeriodInsights } from "./periodInsights";

// Helper: build a list of periods from {start, durationDays} so tests read clearly.
function period(start: string, durationDays: number): PeriodForInsights {
  const [y, m, d] = start.split("-").map(Number);
  const end = new Date(Date.UTC(y, m - 1, d + durationDays - 1));
  const endISO = `${end.getUTCFullYear()}-${String(end.getUTCMonth() + 1).padStart(2, "0")}-${String(
    end.getUTCDate(),
  ).padStart(2, "0")}`;
  return { startDate: start, endDate: endISO };
}

describe("computePeriodInsights", () => {
  it("returns insufficient_data with no periods", () => {
    const r = computePeriodInsights([], "2026-06-21");
    expect(r.periodsLogged).toBe(0);
    expect(r.status).toBe("insufficient_data");
    expect(r.avgCycleLength).toBeNull();
    expect(r.avgPeriodDuration).toBeNull();
    expect(r.predictedNextStart).toBeNull();
    expect(r.currentCycleDay).toBeNull();
  });

  it("with one period: period duration + current cycle day, but no cycle/prediction yet", () => {
    // June 17–20 is a 4-day period; today is the 21st → cycle day 5.
    const r = computePeriodInsights([period("2026-06-17", 4)], "2026-06-21");
    expect(r.periodsLogged).toBe(1);
    expect(r.status).toBe("insufficient_data");
    expect(r.avgPeriodDuration).toBe(4);
    expect(r.currentCycleDay).toBe(5);
    expect(r.avgCycleLength).toBeNull();
    expect(r.predictedNextStart).toBeNull();
  });

  it("with two periods: computes cycle length, average duration, and the next prediction", () => {
    const periods = [period("2026-05-04", 5), period("2026-06-01", 5)];
    const r = computePeriodInsights(periods, "2026-06-10");
    expect(r.avgCycleLength).toBe(28); // May 4 → Jun 1
    expect(r.avgPeriodDuration).toBe(5);
    expect(r.predictedNextStart).toBe("2026-06-29"); // Jun 1 + 28
    expect(r.predictedRangeEnd).toBe("2026-07-03"); // + (5 - 1)
    expect(r.status).toBe("on_track"); // prediction still in the future
  });

  // Threshold table (tech spec §6.3). Two periods 28 days apart → predicted 2026-06-29.
  const twoCycles = [period("2026-05-04", 5), period("2026-06-01", 5)];

  it("is on_track at exactly 4 days past the prediction", () => {
    expect(computePeriodInsights(twoCycles, "2026-07-03").status).toBe("on_track");
  });

  it("is running_late at exactly 5 days past, and at 13", () => {
    expect(computePeriodInsights(twoCycles, "2026-07-04").status).toBe("running_late");
    expect(computePeriodInsights(twoCycles, "2026-07-12").status).toBe("running_late");
  });

  it("is significant_delay at exactly 14 days past", () => {
    expect(computePeriodInsights(twoCycles, "2026-07-13").status).toBe("significant_delay");
  });

  it("is possible_skip once a full extra cycle has elapsed with nothing logged", () => {
    // predicted 2026-06-29 + avgCycle 28 = 2026-07-27.
    expect(computePeriodInsights(twoCycles, "2026-07-27").status).toBe("possible_skip");
  });

  it("reports daysSincePredicted and daysUntilPredicted with correct signs", () => {
    const future = computePeriodInsights(twoCycles, "2026-06-24"); // 5 days before predicted
    expect(future.daysUntilPredicted).toBe(5);
    expect(future.daysSincePredicted).toBe(-5);

    const late = computePeriodInsights(twoCycles, "2026-07-06"); // 7 days after predicted
    expect(late.daysSincePredicted).toBe(7);
    expect(late.daysUntilPredicted).toBe(-7);
  });

  it("averages only the last 6 cycle pairs", () => {
    // 8 periods: first gap is a wild 50 days, the next six gaps are all 28.
    const gaps = [50, 28, 28, 28, 28, 28, 28];
    const starts = ["2026-01-01"];
    for (const g of gaps) {
      const [y, m, d] = starts[starts.length - 1].split("-").map(Number);
      const next = new Date(Date.UTC(y, m - 1, d + g));
      starts.push(
        `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(
          next.getUTCDate(),
        ).padStart(2, "0")}`,
      );
    }
    const periods = starts.map((s) => period(s, 5));
    const r = computePeriodInsights(periods, starts[starts.length - 1]);
    // The 50-day outlier is the 7th-from-last pair and must be excluded → average is 28.
    expect(r.avgCycleLength).toBe(28);
  });

  it("averages only the last 6 period durations", () => {
    const periods = [
      period("2026-01-01", 10),
      period("2026-01-29", 10),
      period("2026-02-26", 5),
      period("2026-03-26", 5),
      period("2026-04-23", 5),
      period("2026-05-21", 5),
      period("2026-06-18", 5),
      period("2026-07-16", 5),
    ];
    // Last six durations are all 5; the two leading 10-day periods are outside the window.
    expect(computePeriodInsights(periods, "2026-07-20").avgPeriodDuration).toBe(5);
  });

  it("sorts unordered input before computing", () => {
    const r = computePeriodInsights([period("2026-06-01", 5), period("2026-05-04", 5)], "2026-06-10");
    expect(r.avgCycleLength).toBe(28);
    expect(r.mostRecentStart).toBe("2026-06-01");
  });
});
