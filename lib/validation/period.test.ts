import { describe, expect, it } from "vitest";
import { periodEntrySchema, periodIdSchema, periodUpdateSchema } from "./period";

const base = { startDate: "2026-06-10", endDate: "2026-06-14", notes: "" };
const uuid = "11111111-1111-4111-8111-111111111111";

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

describe("periodUpdateSchema", () => {
  it("accepts a valid id plus a valid range", () => {
    expect(periodUpdateSchema.safeParse({ id: uuid, ...base }).success).toBe(true);
  });

  it("rejects a missing or malformed id", () => {
    expect(periodUpdateSchema.safeParse(base).success).toBe(false);
    expect(periodUpdateSchema.safeParse({ id: "not-a-uuid", ...base }).success).toBe(false);
  });

  it("still enforces end-not-before-start", () => {
    expect(periodUpdateSchema.safeParse({ id: uuid, ...base, endDate: "2026-06-09" }).success).toBe(
      false,
    );
  });
});

describe("periodIdSchema", () => {
  it("accepts a uuid and rejects anything else", () => {
    expect(periodIdSchema.safeParse({ id: uuid }).success).toBe(true);
    expect(periodIdSchema.safeParse({ id: "nope" }).success).toBe(false);
  });
});
