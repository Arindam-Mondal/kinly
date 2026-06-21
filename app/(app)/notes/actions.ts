"use server";

import { revalidatePath } from "next/cache";
import { todayISO } from "@/components/calendar/calendarUtils";
import { createClient } from "@/lib/supabase/server";
import { noteEntrySchema, noteIdSchema, noteUpdateSchema } from "@/lib/validation/note";

export type SaveResult = { error: string } | { ok: true };

function revalidateAfterWrite() {
  revalidatePath("/notes");
}

// Inserts a standalone journal note as a log_entries row (domain = 'note', no end_date).
export async function createNoteEntry(input: unknown): Promise<SaveResult> {
  const parsed = noteEntrySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check your note." };

  const { date, notes } = parsed.data;
  if (date > todayISO()) return { error: "You can't add a note for a future day." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You're not signed in." };

  const { error } = await supabase.from("log_entries").insert({
    user_id: user.id,
    domain: "note",
    start_date: date,
    end_date: null,
    notes,
  });
  if (error) return { error: "Could not save. Please try again." };

  revalidateAfterWrite();
  return { ok: true };
}

// Edits a standalone note. RLS scopes writes to the owner; the explicit user_id + domain
// filters are defence in depth — a forged id can never reach a period row through here.
export async function updateNoteEntry(input: unknown): Promise<SaveResult> {
  const parsed = noteUpdateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check your note." };

  const { id, date, notes } = parsed.data;
  if (date > todayISO()) return { error: "You can't add a note for a future day." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You're not signed in." };

  const { error } = await supabase
    .from("log_entries")
    .update({ start_date: date, notes })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("domain", "note");
  if (error) return { error: "Could not save. Please try again." };

  revalidateAfterWrite();
  return { ok: true };
}

// Deletes a standalone note.
export async function deleteNoteEntry(input: unknown): Promise<SaveResult> {
  const parsed = noteIdSchema.safeParse(input);
  if (!parsed.success) return { error: "Could not delete this note." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You're not signed in." };

  const { error } = await supabase
    .from("log_entries")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", user.id)
    .eq("domain", "note");
  if (error) return { error: "Could not delete. Please try again." };

  revalidateAfterWrite();
  return { ok: true };
}
