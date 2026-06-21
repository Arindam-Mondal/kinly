import { describe, expect, it } from "vitest";
import { getInsightsSummary } from "./getInsightsSummary";
import type { PredictionResult } from "./periodInsights";

// Minimal prediction stub; only the fields the summary reads need to be realistic.
function prediction(over: Partial<PredictionResult>): PredictionResult {
  return {
    periodsLogged: 6,
    avgCycleLength: 28,
    avgPeriodDuration: 5,
    mostRecentStart: "2026-06-01",
    currentCycleDay: 10,
    predictedNextStart: "2026-06-29",
    predictedRangeEnd: "2026-07-03",
    daysUntilPredicted: 8,
    daysSincePredicted: -8,
    status: "on_track",
    ...over,
  };
}

describe("getInsightsSummary", () => {
  it("guides the user when there is not enough data", () => {
    const s = getInsightsSummary(prediction({ status: "insufficient_data", avgCycleLength: null }));
    expect(s).toMatch(/log/i);
  });

  it("describes an on-track cycle in domain-descriptive terms", () => {
    const s = getInsightsSummary(prediction({ status: "on_track" }));
    expect(s).toMatch(/cycle length/i);
    expect(s).not.toMatch(/your cycle/i); // sex-neutral, not first-person
  });

  it("describes a running-late variance neutrally", () => {
    const s = getInsightsSummary(prediction({ status: "running_late", daysSincePredicted: 6 }));
    expect(s).toMatch(/longer than the recent average/i);
  });

  it("ends significant-delay copy with a soft, non-pushy provider suggestion", () => {
    const s = getInsightsSummary(prediction({ status: "significant_delay", daysSincePredicted: 16 }));
    expect(s).toMatch(/healthcare provider/i);
    expect(s).toMatch(/if/i); // conditional "if this continues", never an imperative
  });

  it("frames a possible skip without alarm", () => {
    const s = getInsightsSummary(prediction({ status: "possible_skip" }));
    expect(s).toMatch(/skip/i);
  });

  it("is never alarmist or all-caps for any status", () => {
    const statuses = [
      "insufficient_data",
      "on_track",
      "running_late",
      "significant_delay",
      "possible_skip",
    ] as const;
    for (const status of statuses) {
      const s = getInsightsSummary(prediction({ status }));
      expect(s).not.toMatch(/WARNING|URGENT|ABNORMAL/);
      // No shouty all-caps words (≥4 consecutive capitals).
      expect(s).not.toMatch(/\b[A-Z]{4,}\b/);
    }
  });
});
