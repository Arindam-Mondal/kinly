import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date");

// A standalone journal note must actually contain text — an empty note is meaningless,
// unlike a period whose notes field is genuinely optional.
const noteFields = {
  date: isoDate,
  notes: z
    .string()
    .trim()
    .min(1, "Write something first.")
    .max(1000, "Notes must be 1000 characters or fewer"),
};

export const noteEntrySchema = z.object(noteFields);

// Same fields plus the row id, for editing an existing note.
export const noteUpdateSchema = z.object({ id: z.string().uuid("Invalid id"), ...noteFields });

export const noteIdSchema = z.object({ id: z.string().uuid("Invalid id") });

export type NoteEntryInput = z.infer<typeof noteEntrySchema>;
export type NoteUpdateInput = z.infer<typeof noteUpdateSchema>;
