import { describe, expect, it } from "vitest";
import { periodEntrySchema } from "./period";

const base = { startDate: "2026-06-10", endDate: "2026-06-14", notes: "" };

describe("periodEntrySchema", () => {
  it("accepts a valid range and treats empty notes as undefined", () => {
    const result = periodEntrySchema.parse(base);
    expect(result.notes).toBeUndefined();
  });

  it("accepts a single-day period", () => {
    expect(periodEntrySchema.safeParse({ ...base, endDate: base.startDate }).success).toBe(true);
  });

  it("rejects an end date before the start date", () => {
    expect(periodEntrySchema.safeParse({ ...base, endDate: "2026-06-09" }).success).toBe(false);
  });

  it("rejects malformed dates", () => {
    expect(periodEntrySchema.safeParse({ ...base, startDate: "06/10/2026" }).success).toBe(false);
  });

  it("rejects notes longer than 1000 characters", () => {
    expect(periodEntrySchema.safeParse({ ...base, notes: "x".repeat(1001) }).success).toBe(false);
  });
});
