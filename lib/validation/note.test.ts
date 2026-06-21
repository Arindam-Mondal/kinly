import { describe, expect, it } from "vitest";
import { noteEntrySchema, noteIdSchema, noteUpdateSchema } from "./note";

const VALID_ID = "11111111-1111-4111-8111-111111111111";

describe("noteEntrySchema", () => {
  it("accepts a note with a date and text", () => {
    const result = noteEntrySchema.safeParse({ date: "2026-06-10", notes: "Felt great today." });
    expect(result.success).toBe(true);
  });

  it("trims surrounding whitespace from the text", () => {
    const result = noteEntrySchema.parse({ date: "2026-06-10", notes: "  hello  " });
    expect(result.notes).toBe("hello");
  });

  it("rejects an empty note — a journal entry needs text", () => {
    expect(noteEntrySchema.safeParse({ date: "2026-06-10", notes: "" }).success).toBe(false);
  });

  it("rejects a whitespace-only note", () => {
    expect(noteEntrySchema.safeParse({ date: "2026-06-10", notes: "   " }).success).toBe(false);
  });

  it("rejects text over 1000 characters", () => {
    const result = noteEntrySchema.safeParse({ date: "2026-06-10", notes: "x".repeat(1001) });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed date", () => {
    expect(noteEntrySchema.safeParse({ date: "June 10", notes: "hi" }).success).toBe(false);
  });
});

describe("noteUpdateSchema", () => {
  it("requires a valid uuid id alongside the fields", () => {
    expect(
      noteUpdateSchema.safeParse({ id: VALID_ID, date: "2026-06-10", notes: "edit" }).success,
    ).toBe(true);
    expect(
      noteUpdateSchema.safeParse({ id: "not-a-uuid", date: "2026-06-10", notes: "edit" }).success,
    ).toBe(false);
  });
});

describe("noteIdSchema", () => {
  it("accepts a valid uuid and rejects anything else", () => {
    expect(noteIdSchema.safeParse({ id: VALID_ID }).success).toBe(true);
    expect(noteIdSchema.safeParse({ id: "nope" }).success).toBe(false);
  });
});
