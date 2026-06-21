import { describe, expect, it } from "vitest";
import type { PredictionResult } from "@/lib/domains/period/periodInsights";
import { getDashboardCopy } from "./getDashboardCopy";

// A baseline on_track prediction; individual tests override what they care about.
function result(overrides: Partial<PredictionResult> = {}): PredictionResult {
  return {
    periodsLogged: 3,
    avgCycleLength: 28,
    avgPeriodDuration: 5,
    mostRecentStart: "2026-06-01",
    currentCycleDay: 10,
    predictedNextStart: "2026-06-29",
    predictedRangeEnd: "2026-07-03",
    daysUntilPredicted: 19,
    daysSincePredicted: -19,
    status: "on_track",
    ...overrides,
  };
}

describe("getDashboardCopy — the sex branch", () => {
  it("uses first-person framing for non-male users", () => {
    const copy = getDashboardCopy("female", result());
    expect(copy.title).toBe("Day 10 of your cycle");
    expect(copy.body).toContain("Your next period");
  });

  it("uses neutral third-person framing for male users", () => {
    const copy = getDashboardCopy("male", result());
    expect(copy.title).toBe("Cycle day 10");
    expect(copy.body).not.toMatch(/\byour\b/i);
    expect(copy.body).toContain("Next period expected");
  });

  it("treats other/prefer_not_to_say as first-person (only male is neutral)", () => {
    expect(getDashboardCopy("other", result()).title).toBe("Day 10 of your cycle");
    expect(getDashboardCopy("prefer_not_to_say", result()).title).toBe("Day 10 of your cycle");
  });
});

describe("getDashboardCopy — status copy", () => {
  it("reports how many days late when running late", () => {
    const copy = getDashboardCopy("female", result({ status: "running_late", daysSincePredicted: 7 }));
    expect(copy.body).toContain("7 days later than your average cycle");
    expect(copy.statusLabel).toBe("Late");
  });

  it("ends significant-delay copy with a soft, non-imperative provider suggestion", () => {
    const copy = getDashboardCopy(
      "female",
      result({ status: "significant_delay", daysSincePredicted: 16 }),
    );
    expect(copy.body.toLowerCase()).toContain("healthcare provider");
    // Tone constraint: informational, never an imperative or alarmist.
    expect(copy.body).toMatch(/might be worth/i);
    expect(copy.body).not.toMatch(/see a doctor now|urgent|immediately/i);
    expect(copy.body).toBe(copy.body.replace(/!/g, "")); // no exclamation marks
    expect(copy.body).not.toBe(copy.body.toUpperCase()); // never all-caps
  });

  it("uses calm skip wording for possible_skip", () => {
    const copy = getDashboardCopy("male", result({ status: "possible_skip" }));
    expect(copy.body).toContain("skipped");
    expect(copy.statusLabel).toBe("Skip?");
  });

  it("guides the user to keep logging when data is insufficient", () => {
    const copy = getDashboardCopy("female", result({ status: "insufficient_data", currentCycleDay: 3 }));
    expect(copy.title).toBe("Day 3 of your cycle");
    expect(copy.body).toContain("Log one more cycle");
    expect(copy.statusLabel).toBe("Tracking");
  });
});
