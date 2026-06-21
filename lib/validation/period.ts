import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date");

const periodFields = {
  startDate: isoDate,
  endDate: isoDate,
  // Treat an empty notes field as "no note".
  notes: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().max(1000, "Notes must be 1000 characters or fewer").optional(),
  ),
};

const endNotBeforeStart = {
  check: (v: { startDate: string; endDate: string }) => v.endDate >= v.startDate,
  message: { message: "The end date can't be before the start date.", path: ["endDate"] },
};

export const periodEntrySchema = z
  .object(periodFields)
  .refine(endNotBeforeStart.check, endNotBeforeStart.message);

// Same fields plus the row id, for editing an existing period.
export const periodUpdateSchema = z
  .object({ id: z.string().uuid("Invalid id"), ...periodFields })
  .refine(endNotBeforeStart.check, endNotBeforeStart.message);

export const periodIdSchema = z.object({ id: z.string().uuid("Invalid id") });

export type PeriodEntryInput = z.infer<typeof periodEntrySchema>;
export type PeriodUpdateInput = z.infer<typeof periodUpdateSchema>;
