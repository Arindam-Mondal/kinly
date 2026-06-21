"use server";

import { revalidatePath } from "next/cache";
import { todayISO } from "@/components/calendar/calendarUtils";
import { createClient } from "@/lib/supabase/server";
import { periodEntrySchema, periodIdSchema, periodUpdateSchema } from "@/lib/validation/period";

export type SaveResult = { error: string } | { ok: true };

function revalidateAfterWrite() {
  // The dashboard's predictions are derived from these rows, so refresh both screens.
  revalidatePath("/calendar");
  revalidatePath("/home");
}

// Inserts a period as a log_entries row (domain = 'period').
export async function createPeriodEntry(input: unknown): Promise<SaveResult> {
  const parsed = periodEntrySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the dates." };

  const { startDate, endDate, notes } = parsed.data;
  if (endDate > todayISO()) return { error: "A period can't be logged in the future." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You're not signed in." };

  const { error } = await supabase.from("log_entries").insert({
    user_id: user.id,
    domain: "period",
    start_date: startDate,
    end_date: endDate,
    notes: notes ?? null,
  });
  if (error) return { error: "Could not save. Please try again." };

  revalidateAfterWrite();
  return { ok: true };
}

// Edits an existing period. RLS already scopes writes to the owner; the explicit
// user_id + domain filters are defence in depth so a stray/forged id can't touch
// another user's or another domain's row.
export async function updatePeriodEntry(input: unknown): Promise<SaveResult> {
  const parsed = periodUpdateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the dates." };

  const { id, startDate, endDate, notes } = parsed.data;
  if (endDate > todayISO()) return { error: "A period can't be logged in the future." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You're not signed in." };

  const { error } = await supabase
    .from("log_entries")
    .update({ start_date: startDate, end_date: endDate, notes: notes ?? null })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("domain", "period");
  if (error) return { error: "Could not save. Please try again." };

  revalidateAfterWrite();
  return { ok: true };
}

// Deletes a logged period.
export async function deletePeriodEntry(input: unknown): Promise<SaveResult> {
  const parsed = periodIdSchema.safeParse(input);
  if (!parsed.success) return { error: "Could not delete this period." };

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
    .eq("domain", "period");
  if (error) return { error: "Could not delete. Please try again." };

  revalidateAfterWrite();
  return { ok: true };
}
