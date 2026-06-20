import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date");

export const periodEntrySchema = z
  .object({
    startDate: isoDate,
    endDate: isoDate,
    // Treat an empty notes field as "no note".
    notes: z.preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
      z.string().trim().max(1000, "Notes must be 1000 characters or fewer").optional(),
    ),
  })
  .refine((v) => v.endDate >= v.startDate, {
    message: "The end date can't be before the start date.",
    path: ["endDate"],
  });

export type PeriodEntryInput = z.infer<typeof periodEntrySchema>;
